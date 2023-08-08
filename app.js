const fs = require('fs/promises');

(async () => {
  const commandFileHandler = await fs.open('./command.txt', 'r');

  //Types of command
  const CREATE_FILE = 'create a file';
  const DELETE_FILE = 'delete the file';
  const ADD_TO_FILE = 'add to the file';
  const RENAME_FILE = 'rename the file';
  //functions
  const createFile = async (path) => {
    try {
      const existingFileHandle = await fs.open(path, 'r');
      existingFileHandle.close();
      return console.log(`The file ${path} already exists`);
    } catch (err) {
      //create a new file
      const newFileHandle = await fs.open(path, 'w');
      console.log('A new file was successfully created');
      newFileHandle.close();
    }
  };

  const deleteFile = async (path) => {
    try {
      const existingFileHandle = await fs.open(path, 'r');
      await fs.unlink(path);
      console.log('Delete the file successfully');
      existingFileHandle.close();
    } catch (err) {
      return console.log(`The file ${path} does not exist`);
    }
  };

  let addedContent;
  const addToFile = async (path, content) => {
    if (addedContent === content) return;
    try {
      await fs.appendFile(path, content);
      addedContent = content;
      console.log('Added to the file successfully');
    } catch (err) {
      return console.log(`The file ${path} does not exist`);
    }
  };

  const renameFile = async (oldPath, newPath) => {
    try {
      const existingFileHandle = await fs.open(oldPath, 'r');
      await fs.rename(oldPath, newPath);
      console.log('Renamed the file successfully');
      existingFileHandle.close();
    } catch (err) {
      return console.log(`The file ${oldPath} does not exist`);
    }
  };

  commandFileHandler.on('change', async () => {
    //get the size of our file
    const size = (await commandFileHandler.stat()).size;

    //allocate buffer
    const buff = Buffer.alloc(size);

    //location to start filling buffer
    const offset = 0;

    //no. of bytes to read
    const length = buff.byteLength;

    //position from where to start reading
    const position = 0;

    //read the file
    await commandFileHandler.read(buff, offset, length, position);
    //create file from string to path included in it
    const command = buff.toString('utf-8');
    //check if create a file string is included in the string
    if (command.includes(CREATE_FILE)) {
      //fine
      const filePath = command.substring(CREATE_FILE.length + 1);
      await createFile(filePath);
    }

    if (command.includes(DELETE_FILE)) {
      //delete the file <path>
      const filePath = command.substring(DELETE_FILE.length + 1);
      await deleteFile(filePath);
    }

    if (command.includes(ADD_TO_FILE)) {
      //add to file <path> this content: <content>
      const _idx = command.indexOf('this content:');
      const filePath = command.substring(ADD_TO_FILE.length + 1, _idx - 1);
      const content = command.substring(_idx + 14);
      await addToFile(filePath, content);
    }

    if (command.includes(RENAME_FILE)) {
      const _idx = command.indexOf('to');
      //rename the file <path> to <new path>
      const oldPath = command.substring(RENAME_FILE.length + 1, _idx - 1);
      const newPath = command.substring(_idx + 3);
      await renameFile(oldPath, newPath);
    }
  });

  const watcher = fs.watch('./command.txt');
  for await (const event of watcher) {
    if (event.eventType === 'change') {
      commandFileHandler.emit('change');
    }
  }
})();
