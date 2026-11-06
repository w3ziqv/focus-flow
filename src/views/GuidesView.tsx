import type { TopicId } from '../types'
import { memo, useEffect, useState } from 'react'
import { MotionSurface } from '../ui/motion/MotionSurface'
import TopicsIndex from './TopicsIndex'
import TopicView from './TopicView'
import ArticleView from './ArticleView'

interface Route { topicId: TopicId; articleId?: string }

/** Guide navigation has no timer dependency and survives switching app views. */
function GuidesView({ active }: { active: boolean }): React.JSX.Element {
  const [stack, setStack] = useState<Route[]>([])
  const [direction, setDirection] = useState<'forward' | 'backward'>('forward')
  const navigate = (next: Route[], backward = false) => {
    setDirection(backward ? 'backward' : 'forward')
    setStack(next)
  }
  useEffect(() => {
    const back = (event: KeyboardEvent) => {
      if (active && event.key === 'Escape' && !event.defaultPrevented && !document.querySelector('[role="dialog"][aria-modal="true"]')) {
        setDirection('backward')
        setStack(current => current.slice(0, -1))
      }
    }
    window.addEventListener('keydown', back)
    return () => window.removeEventListener('keydown', back)
  }, [active])
  const routeKey = stack.at(-1)?.articleId ?? stack[0]?.topicId ?? 'index'
  return <MotionSurface value={routeKey} direction={direction} scrollTop={0}>
    {stack.length === 0 ? <TopicsIndex onOpenTopic={topicId => navigate([{ topicId }])} />
      : stack.length === 1 ? <TopicView topicId={stack[0].topicId} onBack={() => navigate([], true)} onOpenArticle={articleId => navigate([...stack, { topicId: stack[0].topicId, articleId }])} />
        : <ArticleView topicId={stack[0].topicId} articleId={stack.at(-1)?.articleId ?? ''} onBack={() => navigate(stack.slice(0, -1), true)} />}
  </MotionSurface>
}

const MemoGuidesView: React.NamedExoticComponent<{ active: boolean }> = memo(GuidesView)
export default MemoGuidesView
