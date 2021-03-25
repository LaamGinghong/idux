import { mount, MountingOptions, VueWrapper } from '@vue/test-utils'
import { renderWork, wait } from '@tests'
import IxPopover from '../src/Popover.vue'
import { PopoverProps } from '../src/types'

const TestComponent = {
  components: { IxPopover },
  props: ['title', 'content', 'placement', 'visible', 'trigger', 'destroyOnHide'],
  template: `
  <ix-popover :title="title" :content="content" :placement="placement" :visible="visible" :trigger="trigger" :destroy-on-hide="destroyOnHide">
    <template v-if='!!$slots.title' #title><slot name='title'/></template>
    <template v-if="!!$slots.content" #content><slot name="content"/></template>
    <span>Popover will show when it's clicked.</span>
  </ix-popover>
  `,
}

describe('Popover.vue', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let PopoverMount: (options?: MountingOptions<PopoverProps>) => VueWrapper<any>

  beforeEach(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    PopoverMount = options => mount(TestComponent as any, options)
  })

  afterEach(() => {
    document.body.querySelectorAll('.ix-popover').forEach(value => {
      value.remove()
    })
  })

  renderWork(IxPopover, { props: { content: 'Content' } })

  test('visible work', async () => {
    const wrapper = PopoverMount({ props: { title: 'Title', content: 'Content' } })
    expect((document.body.querySelector('.ix-popover') as HTMLDivElement).style.display).toEqual('none')
    await wrapper.get('span').trigger('click')
    await wait(100)
    expect((document.body.querySelector('.ix-popover') as HTMLDivElement).style.display).toEqual('')
  })
})