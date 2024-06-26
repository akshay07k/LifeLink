import React, { useState, useEffect, useRef } from 'react';
import service from '../../appwrite/config';
import conf from '../../conf/conf';
import { useSelector } from 'react-redux';

// This is for chat between user and doctor in future

const Room = () => {
    const [messageBody, setMessageBody] = useState('');
    const [messages, setMessages] = useState([]);
    const chatAreaRef = useRef(null);
    const user = useSelector((state) => state.auth.userData);
    // console.log("user", user);

    useEffect(() => {
        getMessages();

        const unsubscribe = service.client.subscribe(
          `databases.${conf.appwriteDatabaseId}.collections.${conf.appwriteCollectionId}.documents`, response => {
            console.log(response);
            if (response.events.includes(
              "databases.*.collections.*.documents.*.create"
              )) {
                console.log('A MESSAGE WAS CREATED')
                setMessages(prevState => [...prevState, response.payload]);
            }

            if (response.events.includes(
              "databases.*.collections.*.documents.*.delete"
              )) {
                console.log('A MESSAGE WAS DELETED!!!')
                setMessages(prevState => prevState.filter(message => message.$id !== response.payload.$id));
            }
        });

        scrollToBottom();

        console.log('unsubscribe:', unsubscribe)

        return () => {
            unsubscribe();
        };
    }, []);

    useEffect(() => {
        
        scrollToBottom();
    }, [messages]);

    const scrollToBottom = () => {
        if (chatAreaRef.current) {
            chatAreaRef.current.scrollTop = chatAreaRef.current.scrollHeight;
        }
    };

    const getMessages = async () => {
        const response = await service.getMessages();
        // console.log(response.documents)
        setMessages(response.documents);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        // console.log('MESSAGE:', messageBody)

        const payload = {
            user_id: user.$id,
            username: user.name,
            body: messageBody
        };

        const response = await service.createMessage(payload);
        // console.log('RESPONSE:', response)
        // setMessages(prevState => [...prevState, response])
        setMessageBody('');
    };

    const deleteMessage = async (id) => {
      await service.deleteMessage(id)
      //setMessages(prevState => prevState.filter(message => message.$id !== message_id))
    } 

    return (
        <div className="flex h-[720px] bg-gray-100">
            {/* Sidebar */}
            <div className="hidden md:block md:w-1/4
             bg-white border-r border-gray-300">
                {/* Sidebar content */}
                <div className="p-4">
                    <h2 className="text-lg font-semibold mb-4">
                      Doctor</h2>
                </div>
            </div>
            {/* Chat Area */}
            <div className="flex-1 flex flex-col">
                {/* Chat Header */}
                <div className="bg-white border-b border-gray-300 
                p-4 flex items-center justify-between">
                    <h2 className="text-lg font-semibold">
                      Chat with Doctor</h2>
                    <button className="text-blue-500 
                    hover:text-blue-700">Settings</button>
                </div>

                {/* Chat Messages */}
                <div ref={chatAreaRef} className="flex-1 
                overflow-y-auto p-4">
                    {messages.map((message, index) => (

                        <div key={`${message.$id}-${index}`} 
                        className={`flex 
                        ${message.$permissions
                        .includes(`delete(\"user:${user?.$id}\")`) 
                        ? 'justify-end' : 'justify-start'} mb-4`}
                        >
                            <div className={`flex flex-col justify-end`}>
                                <p className={`flex text-xs text-gray-500 mb-1 
                                ${message.$permissions
                                .includes(`delete(\"user:${user?.$id}\")`) 
                                ? 'justify-end' : 'justify-start'}`}>
                                    {message.username}</p>
                                <div className={`px-4 py-2 rounded-full 
                                ${message.$permissions
                                .includes(`delete(\"user:${user?.$id}\")`) 
                                ? 'bg-blue-400 text-black' :
                                 'bg-gray-200 text-gray-700'}`}>
                                    <p className="text-md">{message.body}</p>
                                </div>
                                <span className="text-xs text-gray-400">
                                    {new Date(message.$createdAt).toLocaleString()}</span>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Message Input */}
                <form id="message--form" 
                onSubmit={handleSubmit} 
                className="w-full">
                    <div className="bg-white border-t 
                    border-gray-300 p-4 pl-14">
                        <input
                            type="text"
                            placeholder="Type your message..."
                            onChange={(e) => setMessageBody(e.target.value)}
                            value={messageBody}
                            className=" w-5/6 border border-gray-300 rounded-lg p-2 focus:outline-none focus:border-blue-500"
                        />
                        <button className="bg-blue-500 
                        text-white font-semibold px-4 
                        py-2 rounded-lg ml-4">Send</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Room;
