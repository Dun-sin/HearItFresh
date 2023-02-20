import InputComponent from "../../InputComponent"

const UserInput = ({ artistName }) => {
  return (
    <div className="flex flex-col items-center">
      {/* <p className='my-2 font-bold'>OR</p> */}
      <InputComponent label={'Input your favourite artists'} placeholder={'Seperated By a Comma e.g BTS, Travis Scott, Drake'} name={'artistName'} refDefination={artistName} />
    </div>
  )
}

export default UserInput