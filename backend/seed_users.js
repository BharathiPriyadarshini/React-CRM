import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_FILE = path.join(__dirname, 'users.json');

const generateUsers = () => {
    let users = [];

    // Check if file exists and read existing users to restart ID count correctly
    if (fs.existsSync(DATA_FILE)) {
        try {
            users = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
        } catch (err) {
            users = [];
        }
    }

    const startId = users.length > 0 ? Math.max(...users.map(u => u.id)) + 1 : 1;

    for (let i = 0; i < 100; i++) {
        const id = startId + i;
        users.push({
            id: id,
            name: `User ${id}`,
            email: `user${id}@example.com`,
            role: 'user',
            password: 'password'
        });
    }

    fs.writeFileSync(DATA_FILE, JSON.stringify(users, null, 2));
    console.log(`Added 100 dummy users! Total users: ${users.length}`);
};

generateUsers();
