interface LoadingSpinnerProps {
    className?: string;
}

export default function LoadingSpinner({
                                           className = "w-6 h-6" // Giá trị mặc định
                                       }: LoadingSpinnerProps) {
    return (
        <div className={`${className} animate-spin rounded-full border-b-2 border-blue-600`} />
    );
}