import 'reflect-metadata';

process.env.JWT_SECRET = process.env.JWT_SECRET || 'testsecret';
process.env.DB_PATH = process.env.DB_PATH || ':memory:';