import React from 'react';
import Header from './components/Header';
import Footer from './components/Footer';
import GetBetterSongs from './components/GetBetterSongs';

const App = () => {
  return (
    <div className='h-screen flex flex-col gap-10'>
      <Header />
      <GetBetterSongs />
      <Footer />
    </div>
  );
}

export default App;
