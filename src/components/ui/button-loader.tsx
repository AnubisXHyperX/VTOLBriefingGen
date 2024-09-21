import { PropsWithChildren } from 'react'
import Loader from './loader'

interface ButtonLoaderProps {
  isLoading: boolean
}

export default function ButtonLoader(
  props: PropsWithChildren<ButtonLoaderProps>
) {
  return (
    <>
      <div className={props.isLoading ? 'opacity-0' : ''}>{props.children}</div>
      {props.isLoading && (
        <div className="absolute">
          <Loader size="sm" />
        </div>
      )}
    </>
  )
}
