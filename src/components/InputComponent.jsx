const InputComponent = ({ label, placeholder, name, refDefination = null, onInputFocus = null }) => {
  return (
    <label htmlFor={name} className='md:min-w-[40vw] md:max-w-[50%] min-w-[300px] block mb-1 text-fsm'>
      <h3>{label}</h3>
      <input type="text" placeholder={placeholder} name={name} className='w-full h-10 rounded p-2 outline-none border-2 focus:border-brand placeholder-font-size-fxs' onFocus={onInputFocus} ref={refDefination} aria-label={name} />
    </label>
  );
}

export default InputComponent