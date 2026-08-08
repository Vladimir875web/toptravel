export default function Success({ onHome }) {
  return (
    <section className="success">
      <div className="success__card">
        <div className="success__mark" aria-hidden>
          ✓
        </div>
        <h2>Заявка отправлена</h2>
        <p className="muted">
          Менеджер получил уведомление и скоро свяжется с вами в Telegram или по
          телефону.
        </p>
        <button type="button" className="btn btn--primary" onClick={onHome}>
          Вернуться в каталог
        </button>
      </div>
    </section>
  )
}
