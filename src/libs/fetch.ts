const oldfetch = window.fetch
//@ts-expect-error some error
window.fetch = async (url: string, options: RequestInit = {}) => {
  try {
    options.mode = "no-cors"
    return oldfetch(url, options)
  } catch (error) {
    console.info(error)
  }
}
