import { Link } from 'react-router-dom';
import ErrorPage from '@/components/rickTexts/ErrorPage';

export default function NotFoundPage() {
    return (
        <div>
            <ErrorPage />
            <div className="flex justify-center mt-8 mb-8">
                <Link
                    to="/"
                    className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
                >
                    Quay lại trang chủ
                </Link>
            </div>
        </div>
    );
}
