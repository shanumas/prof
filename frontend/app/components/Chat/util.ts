import OpenAI from "openai";

const openai = new OpenAI({
    apiKey: '',
    dangerouslyAllowBrowser: true
});

const prompt = `
    Extract property type(house/apartment), minimum price, maximum price, nr bedrooms, and square feet from 
    Text. Return comma-separated string in the format: true, [ptype], [min], [max], [beds], [feet].
    If only one price is available, write same values for both minimum price and maximum price.
    Example: true, apartment, 100000, 150000, 3, 1393
    If any value not found, ask user to provide missing details(with false as prefix). Reply less than 10 words.
`;

const gpt35='gpt-3.5-turbo-0125'
//const gpt4o = 'gpt-4o'
const gpt40mini = 'gpt-4o-mini'

export const getWebSocketApiHost = () => {
  if (process.env.NODE_ENV === "development") {
    return "ws://localhost:8000/ws/generate_stream";
  }
  // If you're serving the app directly through FastAPI, generate the WebSocket URL based on the current location.
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  const host = window.location.host;
  return `${protocol}//${host}/ws/generate_stream`;
};

export const preferenceCollected = async (sendInput: string): Promise<string> => {

  const response = await openai.chat.completions.create({
      model: gpt40mini,
      messages: [
        {
          "role": "system",
          "content": prompt
        },
        {"role": "user", "content": `User entered: "${sendInput}"`}
      ]
    });

  return response.choices[0].message.content??''

}

export const storeMapInLocalStorage = (key:string, map:Map<any,any>) => {
  const mapArray = Array.from(map.entries());
  const mapString = JSON.stringify(mapArray);
  localStorage.setItem(key, mapString);
};

export const getMapFromLocalStorage = (key:string) => {
  const mapString = localStorage.getItem(key);
  if (mapString) {
    const mapArray = JSON.parse(mapString);
    return new Map(mapArray);
  }
  return null;
};
