import {NextFunction, Request, Response} from 'express';
import jwt from 'jsonwebtoken';

interface CustomRequest extends Request {
    user?: any;
}

export const AuthMiddleware = (req: CustomRequest, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        res.status(401).json({ message: 'Token manquant.' });
        console.log("Token manquant");
        return;
    }

    const token = authHeader.split(' ')[1];

    try {
        req.user = jwt.verify(token, process.env.JWT_SECRET as string);
        next();
    } catch (error) {
        res.status(403).json({ message: 'Token invalide.' });
        console.log("Token invalide");
    }
};