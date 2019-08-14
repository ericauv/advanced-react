import { mount } from 'enzyme';
import toJSON from 'enzyme-to-json';
import { MockedProvider } from 'react-apollo/test-utils';
import { ApolloConsumer } from 'react-apollo';
import wait from 'waait';
import Signout, { SIGNOUT_MUTATION } from '../components/Signout';
import { CURRENT_USER_QUERY } from '../components/User';
import { fakeUser } from '../lib/testUtils';

const user = { ...fakeUser() };
const mocks = [
  {
    request: { query: CURRENT_USER_QUERY },
    result: {
      data: {
        me: {
          ...user
        }
      }
    }
  },
  {
    request: { query: CURRENT_USER_QUERY },
    result: {
      data: {
        me: {
          id: 'test',
          cart: []
        }
      }
    }
  },
  {
    request: { query: SIGNOUT_MUTATION },
    result: {
      data: {
        signout: {
          __typename: 'SuccessMessage',
          message: 'Successfully sig  ned out!'
        }
      }
    }
  }
];

describe('<Signout></Signout>', () => {
  it('renders and matches snapshot', async () => {
    const wrapper = mount(
      <MockedProvider mocks={mocks}>
        <Signout />
      </MockedProvider>
    );
    await wait();
    wrapper.update();
    expect(wrapper.find('button').text()).toContain('Sign Out');
  });
});
