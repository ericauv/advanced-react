import wait from 'waait';
import { mount } from 'enzyme';
import { MockedProvider } from 'react-apollo/test-utils';
import toJSON from 'enzyme-to-json';
import Order, { SINGLE_ORDER_QUERY } from '../components/Order';
import { fakeOrder } from '../lib/testUtils';

const order = { ...fakeOrder() };

const mocks = [
  {
    request: { query: SINGLE_ORDER_QUERY, variables: { id: order.id } },
    result: {
      data: {
        order: {
          ...order
        }
      }
    }
  }
];

describe('<Order></Order>', () => {
  it('renders and matches snapshot', async () => {
    const wrapper = mount(
      <MockedProvider mocks={mocks}>
        <Order id={order.id} />
      </MockedProvider>
    );
    await wait();
    wrapper.update();
    expect(toJSON(wrapper.find('div.order'))).toMatchSnapshot();
  });
});
