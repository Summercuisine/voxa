import { defineComponent, h, type PropType, type VNode } from 'vue'
import { NAvatar } from 'naive-ui'
import { formatRelativeTime, getUserAvatar } from '@/utils'
import type { Comment } from '@/types'

// 递归评论组件
const CommentItem = defineComponent({
  name: 'CommentItem',
  props: {
    comment: { type: Object as PropType<Comment>, required: true },
    depth: { type: Number, default: 0 },
  },
  emits: {
    reply: (_comment: Comment) => true,
    'go-user': (_userId: string) => true,
  },
  setup(props, { emit }) {
    function handleReply() {
      emit('reply', props.comment)
    }
    function goToUser(userId: string) {
      emit('go-user', userId)
    }
    return (): VNode => {
      const comment = props.comment
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
        ...(comment.replies || []).map((child) =>
          h(CommentItem, {
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
