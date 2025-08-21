// jest.config.ts
import type { Config } from 'jest';

const config: Config = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    roots: ['<rootDir>/tests'],
    moduleFileExtensions: ['ts', 'tsx', 'js', 'json'],
    testRegex: '(/__tests__/.*|(\\.|/)(test|spec))\\.(ts|tsx)$',
    setupFilesAfterEnv: ['<rootDir>/tests/jest.setup.ts'],
    transform: {
        '^.+\\.(ts|tsx)$': [
            'ts-jest',
            {
                tsconfig: '<rootDir>/tsconfig.json',
                isolatedModules: true,
            },
        ],
    },
    // Ne PAS mapper .js -> '' (ça casse express, typeorm & co)
    verbose: true,
    maxWorkers: 1,
};

export default config;
