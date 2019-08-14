import wait from 'waait';
import { MockedProvider } from 'react-apollo/test-utils';
import { mount } from 'enzyme';
import toJSON from 'enzyme-to-json';
import { ApolloConsumer } from 'react-apollo';
import Router from 'next/router';
import NProgress from 'nprogress';
import TakeMyMoney, { CREATE_ORDER_MUTATION } from '../components/TakeMyMoney';
import { CURRENT_USER_QUERY } from '../components/User';
import {
  fakeUser,
  fakeCartItem,
  fakeItem,
  fakeOrder,
  fakeOrderItem
} from '../lib/testUtils';

const user = fakeUser();
const cartItem = fakeCartItem();
const order = fakeOrder();
// define push() as empty function until testing routing
Router.router = {
  push() {}
};
const mocks = [
  {
    request: { query: CURRENT_USER_QUERY },
    result: {
      data: {
        me: {
          ...user,
          cart: [cartItem]
        }
      }
    }
  }
];

describe('<TakeMyMoney></TakeMyMoney>', () => {
  it('renders and matches snapshot', async () => {
    const wrapper = mount(
      <MockedProvider mocks={mocks}>
        <TakeMyMoney />
      </MockedProvider>
    );
    await wait();
    wrapper.update();
    const checkoutButton = wrapper.find('ReactStripeCheckout');
    expect(toJSON(checkoutButton)).toMatchSnapshot();
  });
  it('creates an order ontoken', async () => {
    const createOrderMock = jest.fn().mockResolvedValue({
      data: {
        createOrder: {
          id: order.id
        }
      }
    });
    const wrapper = mount(
      <MockedProvider mocks={mocks}>
        <TakeMyMoney />
      </MockedProvider>
    );
    await wait();
    wrapper.update();
    const component = wrapper.find('TakeMyMoney').instance();
    // manually call onToken method
    component.onToken({ id: order.id }, createOrderMock);
    expect(createOrderMock).toHaveBeenCalled();
    expect(createOrderMock).toHaveBeenCalledWith({
      variables: { token: order.id }
    });
  });
  it('turns progress bar on when loading', async () => {
    const wrapper = mount(
      <MockedProvider mocks={mocks}>
        <TakeMyMoney />
      </MockedProvider>
    );
    await wait();
    wrapper.update();
    NProgress.start = jest.fn();
    const createOrderMock = jest.fn().mockResolvedValue({
      data: {
        createOrder: {
          id: order.id
        }
      }
    });
    const component = wrapper.find('TakeMyMoney').instance();
    component.onToken({ id: order.id }, createOrderMock);
    expect(NProgress.start).toHaveBeenCalled();
  });
  it('routes to order page', async () => {
    const wrapper = mount(
      <MockedProvider mocks={mocks}>
        <TakeMyMoney />
      </MockedProvider>
    );
    await wait();
    wrapper.update();
    // mock createOrder Mutation's response/resolved value
    const createOrderMock = jest.fn().mockResolvedValue({
      data: {
        createOrder: {
          id: order.id
        }
      }
    });
    // simulate router
    Router.router.push = jest.fn();
    const component = wrapper.find('TakeMyMoney').instance();
    component.onToken({ id: order.id }, createOrderMock);
    // wait to ensure router was called
    await wait(50);
    expect(Router.router.push).toHaveBeenCalledWith({
      pathname: '/order',
      query: { id: order.id }
    });
  });
});
