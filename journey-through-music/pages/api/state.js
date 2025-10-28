import { getState } from '../../lib/store';

export default function handler(req, res) {
  res.status(200).json(getState());
}
