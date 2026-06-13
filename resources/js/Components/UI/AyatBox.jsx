export default function AyatBox({ text, reference }) {
    if (!text) return null;
    return (
        <div className="ayat-box">
            <p className="ayat-text">"{text}"</p>
            <p className="ayat-ref">— {reference}</p>
        </div>
    );
}
