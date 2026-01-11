import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import jwt from 'jsonwebtoken';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

const JWT_SECRET = 'secret_key';
const DATA_FILE = path.join(__dirname, 'users.json');

// Initialize data file if it doesn't exist
const initializeData = () => {
    if (!fs.existsSync(DATA_FILE)) {
        const initialUsers = [
            { id: 1, name: 'John Doe', email: 'john@example.com', role: 'admin', password: 'password' },
            { id: 2, name: 'Jane Smith', email: 'jane@example.com', role: 'user', password: 'password' }
        ];
        fs.writeFileSync(DATA_FILE, JSON.stringify(initialUsers, null, 2));
    }
};

initializeData();

const readUsers = () => {
    try {
        const data = fs.readFileSync(DATA_FILE, 'utf8');
        return JSON.parse(data);
    } catch (err) {
        console.error("Error reading users file:", err);
        return [];
    }
};

const writeUsers = (users) => {
    try {
        fs.writeFileSync(DATA_FILE, JSON.stringify(users, null, 2));
    } catch (err) {
        console.error("Error writing users file:", err);
    }
};

const validateEmail = (email) => {
    return String(email)
        .toLowerCase()
        .match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
};

const authenticate = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).json({ message: 'Access denied. Token required' });
    }
    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(401).json({ message: 'Invalid or expired token' });
    }
};

const authorizeAdmin = (req, res, next) => {
    if (req.user.role !== "admin") {
        return res.status(403).json({
            message: "Admin access only",
        });
    }
    next();
};

// POST /api/login
app.post('/api/login', (req, res) => {
    let { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password required' });
    }
    email = email.trim().toLowerCase();

    const users = readUsers();
    const user = users.find(u => u.email === email);

    // Simple password check (in a real app, use bcrypt)
    if (!user || (user.password && user.password !== password) || (!user.password && password !== 'password')) {
        return res.status(401).json({ message: 'Invalid email or password' });
    }

    const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        JWT_SECRET,
        { expiresIn: '2h' }
    );
    res.json({
        token,
        user: {
            name: user.name,
            email: user.email,
            role: user.role
        }
    });
});

// GET /api/users
app.get('/api/users', authenticate, (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const users = readUsers();
    // Return users without passwords for security
    const safeUsers = users.map(({ password, ...u }) => u);

    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;

    const paginatedUsers = safeUsers.slice(startIndex, endIndex);

    res.json({
        data: paginatedUsers,
        total: safeUsers.length,
        page,
        totalPages: Math.ceil(safeUsers.length / limit)
    });
});

// POST /api/users
app.post('/api/users', authenticate, authorizeAdmin, (req, res) => {
    const { name, email, role } = req.body;
    if (!name || !email || !role) {
        return res.status(400).json({ message: 'All fields are required' });
    }

    if (!validateEmail(email)) {
        return res.status(400).json({ message: 'Invalid email format' });
    }

    const users = readUsers();
    if (users.some(u => u.email === email)) {
        return res.status(400).json({ message: 'A user with this email already exists' });
    }

    const newId = users.length > 0 ? Math.max(...users.map(u => u.id)) + 1 : 1;
    const newUser = {
        id: newId,
        name,
        email,
        role,
        password: req.body.password || 'password' // Use provided password or default
    };

    users.push(newUser);
    writeUsers(users);

    const { password, ...safeUser } = newUser;
    res.status(201).json(safeUser);
});

// POST /api/change-password
app.post('/api/change-password', authenticate, (req, res) => {
    const { oldPassword, newPassword } = req.body;
    if (!oldPassword || !newPassword) {
        return res.status(400).json({ message: 'Both old and new passwords are required' });
    }

    const users = readUsers();
    // req.user.id comes from the token
    const userIndex = users.findIndex(u => u.id === req.user.id);

    if (userIndex === -1) {
        return res.status(404).json({ message: 'User not found' });
    }

    const user = users[userIndex];

    // Check old password
    if ((user.password && user.password !== oldPassword) || (!user.password && oldPassword !== 'password')) {
        return res.status(401).json({ message: 'Incorrect old password' });
    }

    // Update password
    users[userIndex].password = newPassword;
    writeUsers(users);

    res.json({ message: 'Password updated successfully' });
});

// PUT /api/users/:id
app.put('/api/users/:id', authenticate, authorizeAdmin, (req, res) => {
    const id = parseInt(req.params.id);
    const users = readUsers();
    const userIndex = users.findIndex(u => u.id === id);

    if (userIndex === -1) {
        return res.status(404).json({ message: 'User not found' });
    }

    const { name, email, role } = req.body;

    if (email && email !== users[userIndex].email) {
        if (!validateEmail(email)) {
            return res.status(400).json({ message: 'Invalid email format' });
        }
        if (users.some(u => u.email === email)) {
            return res.status(400).json({ message: 'Email already in use' });
        }
    }

    users[userIndex] = {
        ...users[userIndex],
        name: name || users[userIndex].name,
        email: email || users[userIndex].email,
        role: role || users[userIndex].role
    };

    writeUsers(users);

    const { password, ...safeUser } = users[userIndex];
    res.json(safeUser);
});

// DELETE /api/users/:id
app.delete('/api/users/:id', authenticate, authorizeAdmin, (req, res) => {
    const id = parseInt(req.params.id);
    let users = readUsers();
    const initialLength = users.length;

    users = users.filter(u => u.id !== id);

    if (users.length === initialLength) {
        return res.status(404).json({ message: 'User not found' });
    }

    writeUsers(users);
    res.json({ message: 'User deleted successfully' });
});

// Global error handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Something went wrong on the server' });
});

const PORT = 3001;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
