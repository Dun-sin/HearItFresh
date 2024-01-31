const UserInput = ({ setIsDifferentTypesOfArtists, setIsNotPopularArtists }) => {

  const getDiffientTypesOfArtists = (e) => {
    if (e.target.checked) {
      setIsDifferentTypesOfArtists(true)
    } else {
      setIsDifferentTypesOfArtists(false)
    }
  }

  const getNonePopularArtists = (e) => {
    if (e.target.checked) {
      setIsNotPopularArtists(true)
    } else {
      setIsNotPopularArtists(false)
    }
  }

  return (
    <section className='flex flex-col w-full'>
      <div className='flex flex-col gap-1'>
        <label htmlFor="oppositeArtists" className='flex gap-1 text-fxs'>
          <input type="checkbox" name="oppositeArtists" id='oppositeArtists' onChange={getDiffientTypesOfArtists} aria-label='oppositeArtists' />
          <h3>Get songs from a different genre</h3>
        </label>
        <label htmlFor="nonePopularArtists" className='flex gap-1 text-fxs'>
          <input type="checkbox" name="nonePopularArtists" id="nonePopularArtists" onChange={getNonePopularArtists} />
          <h3>Get songs from none popular artists</h3>
        </label>
      </div>


    </section>
  )
}

export default UserInput