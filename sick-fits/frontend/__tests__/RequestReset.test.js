import wait from 'waait';
import { MockedProvider } from 'react-apollo/test-utils';
import { mount } from 'enzyme';
import toJSON from 'enzyme-to-json';
import Router from 'next/router';
import RequestReset, {
  REQUEST_RESET_MUTATION
} from '../components/RequestReset';

const mocks = [
  {
    request: {
      query: REQUEST_RESET_MUTATION,
      variables: { email: 'test@test.com' }
    },
    result: {
      data: {
        requestReset: {
          message: 'message',
          __typename: 'Message'
        }
      }
    }
  }
];

describe('<RequestReset></RequestReset>', () => {
  it('renders the form and matches snapshot', () => {
    const wrapper = mount(
      <MockedProvider>
        <RequestReset />
      </MockedProvider>
    );
    expect(toJSON(wrapper.find('form'))).toMatchSnapshot();
  });

  it('calls the mutation', async () => {
    const wrapper = mount(
      <MockedProvider mocks={mocks}>
        <RequestReset />
      </MockedProvider>
    );

    // simulate typing an email into email box
    wrapper.find('input').simulate('change', {
      target: { name: 'email', value: 'test@test.com' }
    });
    // simulate submitting the form
    wrapper.find('form').simulate('submit');
    await wait();
    wrapper.update();
    const p = wrapper.find('p');
    expect(p.text()).toContain('Success! Check your email for a reset link.');
  });
});
