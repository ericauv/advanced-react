import wait from 'waait';
import { MockedProvider } from 'react-apollo/test-utils';
import { mount } from 'enzyme';
import toJSON from 'enzyme-to-json';
import Router from 'next/router';
import CreateItem, { CREATE_ITEM_MUTATION } from '../components/CreateItem';

describe('<CreateItem></CreateItem>', () => {
  it('renders the form', () => {
    const wrapper = mount(
      <MockedProvider>
        <CreateItem />
      </MockedProvider>
    );
    const form = wrapper.find('form');
    expect(toJSON(form)).toMatchSnapshot();
  });
});
