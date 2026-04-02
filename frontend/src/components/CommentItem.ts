import { defineComponent, h, type PropType, type VNode, type Component } from 'vue'
import { NAvatar } from 'naive-ui'
import { formatRelativeTime, getUserAvatar } from '@/utils'
import type { Comment } from '@/types'

// 扩展 Comment 类型以支持 children
export interface CommentNode extends Comment {
  children?: CommentNode[]
}

// 递归评论组件 - 使用类型断言解决循环引用
const CommentItem: Component = defineComponent({
  name: 'CommentItem',
  props: {
    comment: { type: Object as PropType<CommentNode>, required: true },
    depth: { type: Number, default: 0 },
  },
  emits: ['reply', 'go-user'],
  setup(props, { emit }) {
    function handleReply() {
      emit('reply', props.comment)
    }
    function goToUser(userId: string) {
      emit('go-user', userId)
    }
    return (): VNode => {
      const comment = props.comment
      const Self = CommentItem as Component
      return h('div', { class: `comment-item comment-item--depth-${Math.min(props.depth, 4)}` }, [
        h('div', { class: 'comment-item__header' }, [
          h(
            'div',
            { class: 'comment-item__author', onClick: () => goToUser(comment.authorId) },
            [
              h(NAvatar, {
                src: getUserAvatar(comment.author?.avatar, comment.author?.username),
                size: 28,
                round: true,
              }),
              h('span', { class: 'comment-item__username' }, comment.author?.username || '匿名用户'),
            ],
          ),
          h('span', { class: 'comment-item__time' }, formatRelativeTime(comment.createdAt)),
        ]),
        h('div', { class: 'comment-item__content' }, comment.content),
        h('div', { class: 'comment-item__actions' }, [
          h(
            'button',
            { class: 'comment-item__reply-btn', onClick: handleReply },
            '回复',
          ),
        ]),
        // 递归渲染子评论
        ...(comment.children || []).map((child: CommentNode) =>
          h(Self, {
            key: child.id,
            comment: child,
            depth: props.depth + 1,
            onReply: (c: Comment) => emit('reply', c),
            onGoUser: (id: string) => emit('go-user', id),
          }),
        ),
      ])
    }
  },
})

export default CommentItem
