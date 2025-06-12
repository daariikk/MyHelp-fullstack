import { promises as fs } from 'fs';
import path from 'path';
import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    // Логирование начала обработки запроса
    console.log('[DELETE PHOTO] Начало обработки запроса', {
        method: req.method,
        body: req.body
    });

    if (req.method !== 'POST') {
        console.warn('[DELETE PHOTO] Ошибка метода', { method: req.method });
        return res.status(405).json({ message: 'Method not allowed' });
    }

    try {
        const { photoPath } = req.body;
        
        // Логирование полученных данных
        console.log('[DELETE PHOTO] Получены данные', { photoPath });

        if (!photoPath) {
            console.error('[DELETE PHOTO] Отсутствует photoPath в теле запроса');
            return res.status(400).json({ message: 'Photo path is required' });
        }

        // Безопасность: проверяем, что путь находится в разрешенной директории
        const uploadDir = path.join(process.cwd(), 'public');
        const fullPath = path.join(uploadDir, photoPath);

        console.log('[DELETE PHOTO] Сформированные пути', {
            uploadDir,
            fullPath
        });

        // Дополнительная проверка безопасности
        if (!fullPath.startsWith(uploadDir)) {
            console.error('[DELETE PHOTO] Попытка доступа за пределы разрешенной директории', {
                fullPath,
                uploadDir
            });
            return res.status(403).json({ message: 'Access denied' });
        }

        try {
            console.log('[DELETE PHOTO] Попытка удаления файла', { fullPath });
            await fs.unlink(fullPath);
            console.log('[DELETE PHOTO] Файл успешно удален', { fullPath });
            return res.status(200).json({ success: true });
        } catch (unlinkError) {
            const error = unlinkError as NodeJS.ErrnoException;
            
            if (error.code === 'ENOENT') {
                console.warn('[DELETE PHOTO] Файл не найден', {
                    fullPath,
                    error: error.message
                });
                return res.status(404).json({ message: 'File not found' });
            }
            
            console.error('[DELETE PHOTO] Ошибка при удалении файла', {
                fullPath,
                error: error.message,
                stack: error.stack
            });
            throw error;
        }
    } catch (error) {
        const err = error as Error;
        console.error('[DELETE PHOTO] Необработанная ошибка', {
            message: err.message,
            stack: err.stack,
            requestBody: req.body
        });
        return res.status(500).json({ 
            message: 'Internal server error',
            details: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    } finally {
        console.log('[DELETE PHOTO] Завершение обработки запроса');
    }
}