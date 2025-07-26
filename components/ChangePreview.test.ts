import { describe, it, expect } from 'vitest';
import ChangePreview from './ChangePreview.vue';

describe('ChangePreview', () => {
    it('renders correctly', () => {
        const wrapper = mount(ChangePreview);
        expect(wrapper.exists()).toBe(true);
    });

    it('displays the correct message', () => {
        const message = 'Hello, World!';
        const wrapper = mount(ChangePreview, {
            props: { message }
        });
        expect(wrapper.text()).toContain(message);
    });
});