'use client'

export default function TableauEmbed({ embedUrl }: { embedUrl: string }) {
  return (
    <iframe
      src={`${embedUrl}?:embed=yes&:toolbar=no&:tabs=no&:showVizHome=no`}
      width="100%"
      height="800"
      style={{ border: 'none' }}
      allowFullScreen
    />
  )
}