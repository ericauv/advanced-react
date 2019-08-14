import wait from 'waait';
import { MockedProvider } from 'react-apollo/test-utils';
import { mount } from 'enzyme';
import toJSON from 'enzyme-to-json';
import { ApolloConsumer } from 'react-apollo';
import RemoveFromCart, {
  REMOVE_FROM_CART_MUTATION
} from '../components/RemoveFromCart';
import { CURRENT_USER_QUERY } from '../components/User';
import { fakeUser, fakeCartItem, fakeItem } from '../lib/testUtils';

global.alert = console.log;

const cartItem = { ...fakeCartItem() };
const user = { ...fakeUser() };
const mocks = [
  {
    request: { query: CURRENT_USER_QUERY },
    result: { data: { me: { ...user, cart: [cartItem] } } }
  },
  {
    request: { query: CURRENT_USER_QUERY },
    result: { data: { me: { ...user, cart: [cartItem] } } }
  },
  {
    request: {
      query: REMOVE_FROM_CART_MUTATION,
      variables: { id: cartItem.id }
    },
    result: {
      data: {
        removeFromCart: {
          ...cartItem
        }
      }
    }
  }
];

describe.only('<RemoveFromCart></RemoveFromCart>', () => {
  it('renders and matches snapshot', async () => {
    const wrapper = mount(
      <MockedProvider mocks={mocks}>
        <RemoveFromCart id={cartItem.id} />
      </MockedProvider>
    );
    expect(toJSON(wrapper.find('button'))).toMatchSnapshot();
  });
  it('removes the item from cart', async () => {
    let apolloClient;
    const wrapper = mount(
      <MockedProvider mocks={mocks}>
        <ApolloConsumer>
          {client => {
            apolloClient = client;
            return <RemoveFromCart id={cartItem.id} />;
          }}
        </ApolloConsumer>
      </MockedProvider>
    );
    const {
      data: { me }
    } = await apolloClient.query({ query: CURRENT_USER_QUERY });
    expect(me.cart).toHaveLength(1);
    expect(me.cart[0].item.price).toBe(cartItem.item.price);
    // remove the item from cart
    wrapper.find('button').simulate('click');
    await wait();
    // check that item was removed from user's cart
    const {
      data: { me: me2 }
    } = await apolloClient.query({ query: CURRENT_USER_QUERY });
    expect(me2.cart).toHaveLength(0);
  });
});
