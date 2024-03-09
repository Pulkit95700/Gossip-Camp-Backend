const socketAsyncHandler = async (io, socket, data, callback) => {
  try {
    // handle data
    await callback(io, socket, data);
  } catch (err) {
    console.log(err);
  }
};

export { socketAsyncHandler };
