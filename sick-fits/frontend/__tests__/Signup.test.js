import wait from 'waait';
import { MockedProvider } from 'react-apollo/test-utils';
import { mount } from 'enzyme';
import toJSON from 'enzyme-to-json';
import Router from 'next/router';
import { ApolloConsumer } from 'react-apollo';
import Signup, { SIGNUP_MUTATION } from '../components/Signup';
import { CURRENT_USER_QUERY } from '../components/User';
import { fakeUser } from '../lib/testUtils';

function simulateTyping(wrapper, name, value) {
  wrapper
    .find(`input[name="${name}"]`)
    .simulate('change', { target: { name, value } });
}
const me = fakeUser();

const mocks = [
  // SIGNUP_MUTATION mock
  {
    request: {
      query: SIGNUP_MUTATION,
      variables: {
        email: me.email,
        name: me.name,
        password: 'test'
      }
    },
    result: {
      data: {
        signup: {
          __typename: 'User',
          id: '4234',
          email: me.email,
          name: me.name
        }
      }
    }
  },

  // CURRENT_USER_QUERY Mock
  {
    request: { query: CURRENT_USER_QUERY },
    result: { data: { me } }
  }
];

describe('<Signup/>', () => {
  it('renders and matches snapshot', async () => {
    const wrapper = mount(
      <MockedProvider>
        <Signup />
      </MockedProvider>
    );
    expect(toJSON(wrapper.find('form'))).toMatchSnapshot();
  });
  it('calls the signup mutation properly', async () => {
    let apolloClient;
    const wrapper = mount(
      <MockedProvider mocks={mocks}>
        <ApolloConsumer>
          {client => {
            apolloClient = client;
            return <Signup />;
          }}
        </ApolloConsumer>
      </MockedProvider>
    );
    await wait();
    wrapper.update();
    // Simulate typing into the signup form
    simulateTyping(wrapper, 'name', me.name);
    simulateTyping(wrapper, 'email', me.email);
    simulateTyping(wrapper, 'password', 'test');
    wrapper.update();
    // Simulate submitting signup form
    wrapper.find('form').simulate('submit');
    await wait();
    // query user out of apollo client (make sure that mutation worked and refetch query of CURRENT_USER also works)
    const user = await apolloClient.query({ query: CURRENT_USER_QUERY });
    expect(user.data.me).toMatchObject(me);
  });
});
