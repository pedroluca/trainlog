import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Header } from './components/header'
import { BottomBar } from './components/bottom-bar'
import { Home } from './pages/home'
import { Training } from './pages/training'

export function App() {

  return (
    <>
    <BrowserRouter>
      <Header />
      <Routes>
        <Route path='/' element={<Home />} />
        <Route path='/train' element={<Training />} />
        {/* <Route path='/about' element={<About />} /> */}
        {/* <Route path='/contact' element={<Contact />} /> */}
      </Routes>
      <BottomBar />
    </BrowserRouter>
    </>
  )
}