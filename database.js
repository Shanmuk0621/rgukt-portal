import pkg from "pg";
const { Pool } = pkg;

const db= new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'alumini',
    password: 'Madhu@8900',
    port: 5432,
})

export default db;