import type { TopicId } from '../types'
import { lazy, memo, Suspense, useEffect, useState } from 'react'
import { ViewLoading } from '../ui/LoadingState'

const TopicsIndex = lazy(() => import('./TopicsIndex'))
const TopicView = lazy(() => import('./TopicView'))
const ArticleView = lazy(() => import('./ArticleView'))
interface Route { topicId: TopicId; articleId?: string }

/** Guide navigation has no timer dependency. Unmounting the screen resets its route. */
function GuidesView(): React.JSX.Element {
  const [stack, setStack] = useState<Route[]>([])
  useEffect(() => {
    const back = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !event.defaultPrevented && !document.querySelector('[role="dialog"][aria-modal="true"]')) {
        setStack(current => current.slice(0, -1))
      }
    }
    window.addEventListener('keydown', back)
    return () => window.removeEventListener('keydown', back)
  }, [])
  return <Suspense fallback={<ViewLoading />}>
    {stack.length === 0 ? <TopicsIndex onOpenTopic={topicId => setStack([{ topicId }])} />
      : stack.length === 1 ? <TopicView topicId={stack[0].topicId} onBack={() => setStack([])} onOpenArticle={articleId => setStack(current => [...current, { topicId: current[0].topicId, articleId }])} />
        : <ArticleView topicId={stack[0].topicId} articleId={stack.at(-1)?.articleId ?? ''} onBack={() => setStack(current => current.slice(0, -1))} />}
  </Suspense>
}

const MemoGuidesView: React.NamedExoticComponent = memo(GuidesView)
export default MemoGuidesView
