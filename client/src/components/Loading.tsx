export default function Loading({ size = 'md' }: { size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' }) {
  return (
    <span className={'loading loading-spinner loading-' + size}></span>
  );
}
