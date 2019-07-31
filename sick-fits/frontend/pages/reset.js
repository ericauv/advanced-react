import Reset from '../components/Reset';

const ResetPage = props => (
  <div>
    <Reset resetToken={props.query.resetToken}>Reset Your Password</Reset>
  </div>
);
export default ResetPage;
