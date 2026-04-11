import { useState, useEffect, FormEvent } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../../store';
import { addPosition, updatePosition, loadPortfolio, clearError } from '../../store/portfolioSlice';
import { PortfolioRecord, AccountType } from '../../types';

const ACCOUNT_OPTIONS: { value: AccountType; label: string; desc: string }[] = [
  { value: 'taxable',          label: '課税口座',            desc: '特定口座・一般口座' },
  { value: 'nisa_growth',      label: '新NISA 成長投資枠',   desc: '年240万円・非課税' },
  { value: 'nisa_accumulation',label: '新NISA つみたて投資枠', desc: '年120万円・非課税' },
];

interface Props {
  onClose: () => void;
  /** 編集モード時に渡す */
  editRecord?: { companyCode: string; record: PortfolioRecord };
}

export default function PositionModal({ onClose, editRecord }: Props) {
  const dispatch = useDispatch<AppDispatch>();
  const { mutating, error } = useSelector((s: RootState) => s.portfolio);

  const isEdit = !!editRecord;

  const [code,        setCode]        = useState(editRecord?.companyCode ?? '');
  const [shares,      setShares]      = useState(String(editRecord?.record.shares ?? ''));
  const [price,       setPrice]       = useState(editRecord?.record.purchase_price ?? '');
  const todayStr = new Date().toISOString().slice(0, 10);
  const [date,        setDate]        = useState(editRecord?.record.purchased_at ?? todayStr);
  const [memo,        setMemo]        = useState(editRecord?.record.memo ?? '');
  const [accountType, setAccountType] = useState<AccountType>(editRecord?.record.account_type ?? 'taxable');
  const [localErr,    setLocalErr]    = useState<string | null>(null);

  useEffect(() => {
    dispatch(clearError());
  }, [dispatch]);

  // Escキーで閉じる
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLocalErr(null);

    const sharesNum = parseInt(shares, 10);
    const priceNum  = parseFloat(price);
    if (isNaN(sharesNum) || sharesNum <= 0) { setLocalErr('株数は正の整数で入力してください'); return; }
    if (isNaN(priceNum)  || priceNum  <= 0) { setLocalErr('購入単価は正の数値で入力してください'); return; }
    if (!date)                               { setLocalErr('購入日を入力してください'); return; }

    const body = {
      company_code:   code.trim().toUpperCase(),
      shares:         sharesNum,
      purchase_price: priceNum,
      purchased_at:   date,
      memo:           memo.trim(),
      account_type:   accountType,
    };

    let result;
    if (isEdit) {
      result = await dispatch(updatePosition({ id: editRecord!.record.id, body }));
    } else {
      result = await dispatch(addPosition(body));
    }

    if (!result.type.endsWith('/rejected')) {
      await dispatch(loadPortfolio());
      onClose();
    }
  };

  const displayError = localErr ?? error;

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-card">
        <div className="modal-header">
          <h2 className="modal-title">{isEdit ? '購入履歴を編集' : '銘柄を追加'}</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        {displayError && <p className="auth-error">{displayError}</p>}

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="modal-row">
            <div className="auth-field">
              <label className="auth-label">銘柄コード</label>
              <input
                className="auth-input"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="例: 8963"
                disabled={isEdit}
                required
                autoFocus={!isEdit}
              />
            </div>
            <div className="auth-field">
              <label className="auth-label">株数</label>
              <input
                className="auth-input"
                type="number"
                min={1}
                value={shares}
                onChange={(e) => setShares(e.target.value)}
                placeholder="100"
                required
                autoFocus={isEdit}
              />
            </div>
          </div>

          <div className="modal-row">
            <div className="auth-field">
              <label className="auth-label">購入単価 (円)</label>
              <input
                className="auth-input"
                type="number"
                min={0}
                step="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="3200"
                required
              />
            </div>
            <div className="auth-field">
              <label className="auth-label">購入日</label>
              <input
                className="auth-input"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="auth-field">
            <label className="auth-label">口座種別</label>
            <div className="account-type-group">
              {ACCOUNT_OPTIONS.map((opt) => (
                <label
                  key={opt.value}
                  className={`account-type-option ${accountType === opt.value ? 'selected' : ''}`}
                >
                  <input
                    type="radio"
                    name="account_type"
                    value={opt.value}
                    checked={accountType === opt.value}
                    onChange={() => setAccountType(opt.value)}
                  />
                  <span className="account-type-label">{opt.label}</span>
                  <span className="account-type-desc">{opt.desc}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="auth-field">
            <label className="auth-label">メモ（任意）</label>
            <input
              className="auth-input"
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              placeholder="例: 長期保有用"
            />
          </div>

          <div className="modal-actions">
            <button type="button" className="modal-cancel-btn" onClick={onClose}>
              キャンセル
            </button>
            <button type="submit" className="auth-btn" disabled={mutating} style={{ flex: 1 }}>
              {mutating ? <span className="btn-spinner" /> : (isEdit ? '更新' : '追加')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
