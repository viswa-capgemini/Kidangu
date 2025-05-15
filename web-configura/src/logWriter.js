const logWriter = (tag, message, write = true) => {
    if(write) {
        console.log(tag, message);
    }
}

export default logWriter;