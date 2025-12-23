class ErrorController {
    constructor() {
        // Configuration
        this.isDevelopment = process.env.NODE_ENV !== 'production';
        
        // Error messages
        this.errorMessages = {
            404: 'Halaman yang Anda cari tidak dapat ditemukan. Mungkin halaman telah dipindahkan, dihapus, atau URL yang Anda masukkan salah.',
            500: 'Terjadi kesalahan pada server. Tim kami telah diberitahu dan sedang menangani masalah ini.',
            503: 'Layanan sedang tidak tersedia. Silakan coba lagi dalam beberapa saat.'
        };
    }

    // Helper: Render error page with consistent format
    renderErrorPage(res, statusCode, title, message, details = null) {
        res.status(statusCode).render(`error/${statusCode}`, {
            layout: false,
            title,
            statusCode,
            message,
            showDetails: this.isDevelopment,
            details: this.isDevelopment ? details : null
        });
    }

    // Route handler: 404 Not Found
    error404 = (req, res) => {
        this.renderErrorPage(
            res,
            404,
            'Page Not Found',
            this.errorMessages[404],
            { path: req.path, method: req.method }
        );
    }

    // Route handler: 500 Internal Server Error
    error500 = (req, res, error = null) => {
        this.renderErrorPage(
            res,
            500,
            'Internal Server Error',
            this.errorMessages[500],
            error ? { message: error.message, stack: error.stack } : null
        );
    }

    // Route handler: 503 Service Unavailable (Database Error)
    renderDatabaseError = (req, res, error) => {
        res.status(503).render('error/database-error', {
            title: 'Database Connection Error',
            error,
            layout: false,
            showDetails: this.isDevelopment,
            details: this.isDevelopment ? error : null
        });
    }

    // Helper: Get error message by status code
    getErrorMessage(statusCode) {
        return this.errorMessages[statusCode] || 'Terjadi kesalahan yang tidak diketahui';
    }

    // Helper: Log error with context
    logError(error, req) {
        console.error('Error occurred:', {
            message: error.message,
            stack: error.stack,
            path: req.path,
            method: req.method,
            timestamp: new Date().toISOString()
        });
    }
}

module.exports = new ErrorController();