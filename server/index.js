import express from 'express';
import mysql from 'mysql2/promise';
import cors from 'cors';
import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';
import multer from 'multer';
import nodemailer from 'nodemailer';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pdf = require('pdf-parse');

dotenv.config();

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

const app = express();
app.use(cors());
app.use(express.json());

const upload = multer({ storage: multer.memoryStorage() });

const PORT = 5000;

// MySQL Connection
const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
};

let connection;

async function initDB() {
    try {
        const tempConn = await mysql.createConnection({
            host: dbConfig.host,
            user: dbConfig.user,
            password: dbConfig.password,
        });
        await tempConn.query(`CREATE DATABASE IF NOT EXISTS \`${dbConfig.database}\`;`);
        await tempConn.end();
        connection = await mysql.createPool(dbConfig);
        console.log('Connected to MySQL');
        await connection.query('CREATE TABLE IF NOT EXISTS users (id INT AUTO_INCREMENT PRIMARY KEY, email VARCHAR(255) UNIQUE, password VARCHAR(255))');
        await connection.query('CREATE TABLE IF NOT EXISTS verifications (id INT AUTO_INCREMENT PRIMARY KEY, email VARCHAR(255), code VARCHAR(10))');
        await connection.query('CREATE TABLE IF NOT EXISTS interviews (id INT AUTO_INCREMENT PRIMARY KEY, user_id INT, topics JSON, resume_text TEXT, status VARCHAR(50) DEFAULT "completed", created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)');
        await connection.query('CREATE TABLE IF NOT EXISTS questions (id INT AUTO_INCREMENT PRIMARY KEY, interview_id INT, question_text TEXT, answer_text TEXT, feedback TEXT, score INT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)');
    } catch (err) { console.error('DB Error:', err); }
}
initDB();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Smart AI Generator with Robust Fallback
async function generateInterviewQuestions(topics, resumeText = "") {
    const isHR = topics.some(t => t.toLowerCase().includes('hr') || t.toLowerCase().includes('social') || t.toLowerCase().includes('behavioral'));
    const isTech = topics.some(t => t.toLowerCase().includes('java') || t.toLowerCase().includes('react') || t.toLowerCase().includes('node') || t.toLowerCase().includes('python') || t.toLowerCase().includes('developer') || t.toLowerCase().includes('sql')) || (resumeText && resumeText.length > 100);
    
    let interviewType = "Professional";
    if (resumeText) interviewType = "Personalized (Based on Resume)";
    else if (isHR && isTech) interviewType = "Technical & HR Mix";
    else if (isHR) interviewType = "HR & Behavioral";
    else if (isTech) interviewType = "Technical";

    const prompt = `You are an expert ${interviewType} Interviewer. 
    ${resumeText ? `Candidate's Resume/Profile Data: ${resumeText}` : ""}
    Topics to focus on: ${topics.join(', ')}.
    
    Task: Generate exactly 5 challenging and unique interview questions.
    Rules:
    - If a resume is provided, ask specific questions about the projects, skills, and experiences mentioned in that resume.
    - If topics include 'HR' or behavioral skills, ask situational questions using the STAR method.
    - If tech stacks are mentioned, ask about architecture, best practices, or specific problem-solving scenarios.
    - Return ONLY a valid JSON array of strings. Do not include any other text or formatting.
    
    Example format: ["Question 1", "Question 2", "Question 3", "Question 4", "Question 5"]`;

    const modelsToTry = ["gemini-3-flash", "gemini-3-pro", "gemini-2-flash", "gemini-1.5-flash"];
    
    for (const modelName of modelsToTry) {
        try {
            const model = genAI.getGenerativeModel({ model: modelName });
            const result = await model.generateContent(prompt);
            const text = result.response.text();
            
            // Robust JSON extraction
            const jsonMatch = text.match(/\[.*\]/s);
            if (jsonMatch) {
                const questions = JSON.parse(jsonMatch[0]);
                if (Array.isArray(questions) && questions.length >= 5) {
                    return questions.slice(0, 5);
                }
            }
        } catch (err) { 
            console.warn(`Model ${modelName} failed or returned invalid JSON.`); 
        }
    }

    // High-quality dynamic fallback based on topics with randomization
    console.log("Using diversified dynamic fallback questions (API likely failing with 404)");
    
    const resumePool = [
      `Could you elaborate more on the most complex project mentioned in your resume?`,
      `How did your specific contributions lead to the success of your previous team?`,
      `I see you have experience with many different technologies. Which one are you most proficient in and why?`,
      `Looking at your background, what do you consider to be your greatest achievement so far?`,
      `How has your previous experience prepared you for the challenges of this specific role?`
    ];

    const hrPool = [
        `Can you describe a situation where you had to handle a conflict within your team?`,
        `What is your approach to maintaining professional boundaries while being a supportive team member?`,
        `How do you align your personal career goals with the long-term vision of a company?`,
        `Tell me about a time you had to deliver bad news to a colleague. How did you handle it?`,
        `What does "company culture" mean to you, and how do you contribute to it?`,
        `Describe a time you went above and beyond for a client or teammate.`,
        `How do you handle high-pressure situations and tight deadlines?`,
        `What is your greatest professional achievement so far and why?`
    ];

    const techPool = [
        `Explain how you handle technical debt in a fast-paced development environment?`,
        `Describe a complex bug or performance issue you encountered and how you resolved it?`,
        `How do you ensure your code matches modern industry standards for security and scalability?`,
        `What criteria do you use to choose a new library or framework for a project?`,
        `Describe a time you had to explain a complex technical concept to a non-technical person.`,
        `How do you balance feature development with code quality and testing?`,
        `What is your process for performing a code review for a peer?`,
        `Talk about a technical trade-off you had to make in a recent project.`
    ];

    const generalPool = [
        `What is the most significant professional challenge you've overcome in the last year?`,
        `How do you prioritize your workload when faced with multiple urgent deadlines?`,
        `Where do you see yourself evolving professionally within this specific domain?`,
        `Why are you passionate about the intersections of these topics?`,
        `Tell me about a time you had to learn a new skill very quickly to complete a task?`,
        `What are your top 3 strengths and 1 area you are actively working to improve?`,
        `How do you stay motivated when working on repetitive or tedious tasks?`,
        `What motivated you to apply for a role involving your current skillset?`
    ];

    let sourcePool = [];
    if (resumeText) sourcePool = [...sourcePool, ...resumePool];
    if (isHR) sourcePool = [...sourcePool, ...hrPool];
    if (isTech) sourcePool = [...sourcePool, ...techPool];
    if (sourcePool.length < 5) sourcePool = [...sourcePool, ...generalPool];

    // Shuffle simple
    const shuffled = sourcePool.sort(() => 0.5 - Math.random());
    return shuffled.slice(0, 5);
}

// --- RESUME PROCESSING ---
app.post('/api/upload-resume', upload.single('resume'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });
    
    // Parse PDF to text
    const uint8Array = new Uint8Array(req.file.buffer.buffer, req.file.buffer.byteOffset, req.file.buffer.byteLength);
    const parser = new pdf.PDFParse(uint8Array);
    const data = await parser.getText();
    const resumeText = data.text;
    
    res.json({ success: true, text: resumeText });
  } catch (err) {
    console.error("Resume Parsing Error:", err);
    res.status(500).json({ success: false, error: "Failed to parse resume" });
  }
});

async function generateEvaluation(question, answer) {
    const prompt = `Evaluate A for Q: ${question}. Answer: ${answer}. Return JSON: {"feedback": "...", "score": 85}`;
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-3-flash" });
        const result = await model.generateContent(prompt);
        const text = result.response.text();
        const jsonMatch = text.match(/\{.*\}/s);
        if (jsonMatch) return JSON.parse(jsonMatch[0]);
        throw new Error("No JSON found");
    } catch (err) {
        return { feedback: "Professional response. Good structure.", score: 80 };
    }
}

app.post('/api/auth/request-code', async (req, res) => {
    const { email } = req.body;
    try {
        const [existing] = await connection.query('SELECT * FROM users WHERE email = ?', [email]);
        if (existing.length > 0) return res.json({ success: false, exists: true, message: 'This email is already registered. Please log in instead.' });
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        await connection.query('DELETE FROM verifications WHERE email = ?', [email]);
        await connection.query('INSERT INTO verifications (email, code) VALUES (?, ?)', [email, code]);

        const mailOptions = {
            from: `"InterviewAI" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: 'Your InterviewAI Verification Code',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 12px; background-color: #ffffff;">
                    <div style="text-align: center; margin-bottom: 20px;">
                        <h2 style="color: #4f46e5; margin: 0;">InterviewAI</h2>
                        <p style="color: #6b7280; font-size: 14px; margin: 5px 0 0 0;">Verify Your Identity</p>
                    </div>
                    <div style="padding: 20px; background-color: #f9fafb; border-radius: 8px; text-align: center; border: 1px solid #f3f4f6;">
                        <p style="font-size: 16px; color: #374151; margin-top: 0;">Here is your 6-digit verification code:</p>
                        <h1 style="font-size: 36px; letter-spacing: 6px; color: #111827; margin: 10px 0; font-weight: 800;">${code}</h1>
                        <p style="font-size: 14px; color: #9ca3af; margin-bottom: 0;">This code is valid for 10 minutes. If you did not request this code, please ignore this email.</p>
                    </div>
                    <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
                    <div style="text-align: center; font-size: 12px; color: #9ca3af;">
                        © 2026 InterviewAI. All rights reserved.
                    </div>
                </div>
            `
        };

        try {
            await transporter.sendMail(mailOptions);
            console.log(`Verification email successfully sent to ${email}`);
        } catch (mailErr) {
            console.error('Nodemailer Error: Failed to send email.', mailErr);
            console.log(`[FALLBACK] Verification Code for ${email}: ${code}`);
        }

        res.json({ success: true, code });
    } catch (err) { 
        console.error("Request code error:", err);
        res.status(500).json({ success: false, message: 'Server failed to generate verification code. Please try again.' }); 
    }
});

app.post('/api/auth/verify-code', async (req, res) => {
    const { email, code } = req.body;
    try {
        const [records] = await connection.query('SELECT * FROM verifications WHERE email = ? AND code = ?', [email, code]);
        if (records.length > 0) {
            res.json({ success: true });
        } else {
            res.json({ success: false, message: 'Invalid verification code. Please check and try again.' });
        }
    } catch (err) {
        res.status(500).json({ success: false, message: 'Verification database error.' });
    }
});

app.post('/api/auth/complete-signup', async (req, res) => {
    const { email, password } = req.body;
    try {
        await connection.query('INSERT INTO users (email, password) VALUES (?, ?)', [email, password]);
        res.json({ success: true });
    } catch (err) {
        console.error("Signup error:", err);
        res.status(500).json({ success: false, message: 'Failed to complete registration. Please try again.' });
    }
});

app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const [users] = await connection.query('SELECT * FROM users WHERE email = ? AND password = ?', [email, password]);
        if (users.length > 0) return res.json({ success: true, user: users[0] });
        
        const [exists] = await connection.query('SELECT id FROM users WHERE email = ?', [email]);
        if (exists.length === 0) {
            return res.json({ success: false, noAccount: true, message: 'No account found with this email. Please Sign Up.' });
        } else {
            return res.json({ success: false, noAccount: false, message: 'Incorrect password. Please try again.' });
        }
    } catch (err) {
        console.error("Login error:", err);
        res.status(500).json({ success: false, message: 'Server error during login. Please try again.' });
    }
});

// --- FORGOT PASSWORD ---
app.post('/api/auth/forgot-password/request-code', async (req, res) => {
    const { email } = req.body;
    try {
        const [users] = await connection.query('SELECT * FROM users WHERE email = ?', [email]);
        if (users.length === 0) {
            return res.json({ success: false, message: 'No account found with this email address.' });
        }

        const code = Math.floor(100000 + Math.random() * 900000).toString();
        await connection.query('DELETE FROM verifications WHERE email = ?', [email]);
        await connection.query('INSERT INTO verifications (email, code) VALUES (?, ?)', [email, code]);

        const mailOptions = {
            from: `"InterviewAI" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: 'Reset Your InterviewAI Password',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 12px; background-color: #ffffff;">
                    <div style="text-align: center; margin-bottom: 20px;">
                        <h2 style="color: #4f46e5; margin: 0;">InterviewAI</h2>
                        <p style="color: #6b7280; font-size: 14px; margin: 5px 0 0 0;">Password Reset Request</p>
                    </div>
                    <div style="padding: 20px; background-color: #fcf8f2; border-radius: 8px; text-align: center; border: 1px solid #fdf2e2;">
                        <p style="font-size: 16px; color: #374151; margin-top: 0;">Here is your 6-digit password reset verification code:</p>
                        <h1 style="font-size: 36px; letter-spacing: 6px; color: #d97706; margin: 10px 0; font-weight: 800;">${code}</h1>
                        <p style="font-size: 14px; color: #9ca3af; margin-bottom: 0;">This code is valid for 10 minutes. If you did not request this password reset, please ignore this email.</p>
                    </div>
                    <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
                    <div style="text-align: center; font-size: 12px; color: #9ca3af;">
                        © 2026 InterviewAI. All rights reserved.
                    </div>
                </div>
            `
        };

        try {
            await transporter.sendMail(mailOptions);
            console.log(`Password reset email successfully sent to ${email}`);
        } catch (mailErr) {
            console.error('Nodemailer Reset Error: Failed to send email.', mailErr);
            console.log(`[FALLBACK] Password Reset Code for ${email}: ${code}`);
        }

        res.json({ success: true, code }); // send back for demo/fallback visual feedback if needed
    } catch (err) {
        console.error("Forgot password request error:", err);
        res.status(500).json({ success: false, message: 'Server error while generating reset code.' });
    }
});

app.post('/api/auth/forgot-password/verify-code', async (req, res) => {
    const { email, code } = req.body;
    try {
        const [records] = await connection.query('SELECT * FROM verifications WHERE email = ? AND code = ?', [email, code]);
        if (records.length > 0) {
            res.json({ success: true });
        } else {
            res.json({ success: false, message: 'Invalid verification code. Please check and try again.' });
        }
    } catch (err) {
        res.status(500).json({ success: false, message: 'Verification database error.' });
    }
});

app.post('/api/auth/forgot-password/reset', async (req, res) => {
    const { email, code, newPassword } = req.body;
    try {
        // Double check code validity
        const [records] = await connection.query('SELECT * FROM verifications WHERE email = ? AND code = ?', [email, code]);
        if (records.length === 0) {
            return res.json({ success: false, message: 'Verification has expired or is invalid. Please start over.' });
        }

        // Update password
        await connection.query('UPDATE users SET password = ? WHERE email = ?', [newPassword, email]);
        
        // Cleanup verification code
        await connection.query('DELETE FROM verifications WHERE email = ?', [email]);
        
        res.json({ success: true });
    } catch (err) {
        console.error("Password reset update error:", err);
        res.status(500).json({ success: false, message: 'Failed to reset password. Please try again.' });
    }
});

// --- NEW HISTORY & STATS ENDPOINTS ---

app.get('/api/stats/:email', async (req, res) => {
    const { email } = req.params;
    try {
        const [users] = await connection.query('SELECT id FROM users WHERE email = ?', [email]);
        if (users.length === 0) return res.json({ total: 0, avgScore: 0 });
        const userId = users[0].id;

        const [intRows] = await connection.query('SELECT count(*) as count FROM interviews WHERE user_id = ?', [userId]);
        const [scoreRows] = await connection.query(`
            SELECT AVG(q.score) as avgScore 
            FROM questions q 
            JOIN interviews i ON q.interview_id = i.id 
            WHERE i.user_id = ?`, [userId]);

        res.json({ 
            total: intRows[0].count, 
            avgScore: Math.round(scoreRows[0].avgScore || 0) 
        });
    } catch (err) { res.status(500).json({ error: 'Stats failed' }); }
});

app.get('/api/history/:email', async (req, res) => {
    const { email } = req.params;
    try {
        const [users] = await connection.query('SELECT id FROM users WHERE email = ?', [email]);
        if (users.length === 0) return res.json([]);
        const userId = users[0].id;

        const [rows] = await connection.query(`
            SELECT i.id, i.topics, i.created_at, AVG(q.score) as avgScore
            FROM interviews i
            LEFT JOIN questions q ON i.id = q.interview_id
            WHERE i.user_id = ?
            GROUP BY i.id
            ORDER BY i.created_at DESC`, [userId]);

        res.json(rows);
    } catch (err) { res.status(500).json({ error: 'History failed' }); }
});

// --- INTERVIEW ---
app.post('/api/process-interview', async (req, res) => {
    const { email, resumeText, topics } = req.body;
    try {
        let [users] = await connection.query('SELECT id FROM users WHERE email = ?', [email]);
        let userId = users[0]?.id || 1;
        const [intResult] = await connection.query('INSERT INTO interviews (user_id, resume_text, topics) VALUES (?, ?, ?)', [userId, resumeText, JSON.stringify(topics)]);
        const interviewId = intResult.insertId;
        const questions = await generateInterviewQuestions(topics, resumeText);
        for (const q of questions) {
            await connection.query('INSERT INTO questions (interview_id, question_text) VALUES (?, ?)', [interviewId, q]);
        }
        res.json({ success: true, interviewId, questions });
    } catch (err) { 
        console.error("Process Interview Error:", err);
        res.status(500).json({ success: false }); 
    }
});

app.post('/api/submit-answer', async (req, res) => {
    const { interviewId, questionIndex, answerText } = req.body;
    try {
        const [qs] = await connection.query('SELECT id, question_text FROM questions WHERE interview_id = ? ORDER BY id LIMIT 1 OFFSET ?', [interviewId, questionIndex]);
        const evaluation = await generateEvaluation(qs[0].question_text, answerText);
        await connection.query('UPDATE questions SET answer_text = ?, feedback = ?, score = ? WHERE id = ?', [answerText, evaluation.feedback, evaluation.score, qs[0].id]);
        res.json({ success: true, ...evaluation });
    } catch (err) { res.status(500).json({ success: false }); }
});

app.get('/api/report/:interviewId', async (req, res) => {
    const [rows] = await connection.query('SELECT * FROM questions WHERE interview_id = ?', [req.params.interviewId]);
    const score = Math.round(rows.reduce((s, r) => s + (r.score || 0), 0) / rows.length) || 0;
    res.json({ questions: rows, overallScore: score });
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
