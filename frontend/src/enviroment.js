
let isProd = true

const server = isProd ?
 "https://zoomvideocallbackend.onrender.com" : 
 "http://localhost:8000"

export default server