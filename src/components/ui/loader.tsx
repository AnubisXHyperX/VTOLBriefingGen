import { Loader as __Loader } from 'lucide-react'

interface LoaderProps {
  size: 'sm' | 'md'
}

const Loader = (props: LoaderProps) => {
  switch (props.size) {
    case 'sm':
      return <__Loader className="animate-spin h-5 w-5" />
    case 'md':
      return <__Loader className="animate-spin" />
  }
}

export default Loader
