import InputComponent from '../../InputComponent'

const UserInput = ({ artistName, setIsDifferentTypesOfArtists, setIsNotPopularArtists, spotifyPlaylist, errorMessages }) => {

  const onInputFocus = (e) => {
    e.target.name === 'artistName' && (spotifyPlaylist.current.value = '')
    e.target.name === 'spotifyPlaylist' && (artistName.current.value = '')
  }

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
    <section className='flex flex-col'>
      <div className='flex flex-col items-center'>
        <div>
          <InputComponent
            label='Give Me Your Favourite Artists'
            placeholder='Seperated By a Comma e.g BTS, Travis Scott, Drake'
            name='artistName'
            refDefination={artistName}
            onInputFocus={onInputFocus}
          />
          {errorMessages.notCorrectFormatForArtist === true && <p className='text-fsm text-red-500'>Seems like you either just gave a single artist or you didn't seperate them by a ','</p>}
        </div>
        <p className='my-2'>OR</p>
        <div>
          <InputComponent
            label='Paste a Spotify Playlist'
            placeholder='e.g https://open.spotify.com/playlist/1B2CSnhZXXVC6xQcY3R4Fk'
            name='spotifyPlaylist'
            refDefination={spotifyPlaylist}
            onInputFocus={onInputFocus}
          />
          {errorMessages.notCorrectSpotifyLink === true && <p className='text-fsm text-red-500'>Not a correct spotify link</p>}
        </div>
      </div>

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