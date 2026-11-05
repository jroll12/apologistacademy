import { Segments } from './Segments';
import { TOTAL_TURNS } from '../conversation/types';

interface Props {
  turn: number;
  status: string;
  badge?: string;
}

export function TurnProgress({ turn, status, badge }: Props) {
  return (
    <div className="turn">
      <div className="row sb">
        <span className="d" style={{ fontSize: 15 }}>Turn {turn} of {TOTAL_TURNS}</span>
        <span className="muted" style={{ fontSize: 13 }}>{status}</span>
      </div>
      <Segments total={TOTAL_TURNS} on={turn} />
      {badge && <span className="badge">{badge}</span>}
    </div>
  );
}
