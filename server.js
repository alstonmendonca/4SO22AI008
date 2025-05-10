import express from 'express';
import axios from 'axios';
const app = express();
import cors from 'cors';
app.use(cors());
app.use(express.json());
const PORT = 4000;
//backend functionality completed

const authbody = {
    "email": "alstondmendonca@gmail.com",
    "name": "alston daniel mendonca",
    "rollNo": "4so22ai008",
    "accessCode": "KjJAxP",
    "clientID": "0552f8da-c1cb-404d-84fa-e5a59164c9ae",
    "clientSecret": "sYtsnZubKShNRzfH"
}


async function authorization(){
    const response = await axios.post('http://20.244.56.144/evaluation-service/auth', authbody);
    const auth_token = response.data.access_token;
    //console.log(`Bearer ${auth_token}`);
    return auth_token;
}
//implement calculate average
function calculateAverage(stock){
    let total = 0;
    let i = 0;
    stock.forEach(s => {
        total = total + s.price;
        i = i+1;
    });
    return (total/i);
}
// the correlation function
function calculateCorrelation(stock1,stock2){
    const price1 = stock1.map(item => item.price);
    const price2 = stock2.map(item => item.price);
    const average_stock_1 = calculateAverage(stock1);
    const average_stock_2 = calculateAverage(stock2);
    let numerator=0;
    let denominator1=0;
    let denominator2=0;
    for (let i=0;i<price1.length;i++){
        const diff1 = price1[i] - average_stock_1;
        const diff2 = price2[i] - average_stock_2;
        numerator += diff1 * diff2 ;
        denominator1+= diff1 * diff1;
        denominator2 += diff2*diff2;
    }
    const denominator = Math.sqrt(denominator1*denominator2);
    const correlation=numerator/denominator;
    return correlation;
}
//created stockcorrelation route
app.get("/stocks/stockcorrelation", async(req,res)=>{
    const {minutes, ticker} = req.query;
    if (!ticker || !Array.isArray(ticker) || ticker.length !== 2){
        return res.status(400).json({"error": "INVALID NUMBER OF TICKERS (MAX 2)"});
    }
    const ticker1 = ticker[0];
    const ticker2 = ticker[1];
    const authtoken = await authorization();
    const stock1 = await axios.get(`http://20.244.56.144/evaluation-service/stocks/${ticker1}?minutes=${minutes}`, 
        {headers:
            {'Authorization': `Bearer ${authtoken}`}
        }
        );
    const stock2=await axios.get(`http://20.244.56.144/evaluation-service/stocks/${ticker2}?minutes=${minutes}`, 
        {headers:
            {'Authorization': `Bearer ${authtoken}`}
        }
        );
    //console.log("STOCK2");
    //console.log(stock2.data);
    const correlation = calculateCorrelation(stock1.data,stock2.data);
    const avgstock1 = calculateAverage(stock1.data);
    //console.log("STOCK1");
    //console.log(stock1.data);
    const s1={"averagePrice": avgstock1,"priceHistory": stock1.data};
    //console.log(s1);
    const avgstock2 = calculateAverage(stock2.data);
    const s2={"averagePrice": avgstock2,"priceHistory": stock2.data};
    //console.log(s2);
    const final_stock = { [ticker1]: s1, [ticker2]: s2 };
    res.status(200).json({"correlation":correlation, "stocks": final_stock});
    
});

//created stock ticker route
app.get("/stocks/:ticker", async (req, res)=>{
    const ticker = req.params.ticker;
    const { minutes, aggregation } = req.query;
    if (!minutes || isNaN(minutes)) {
    return res.status(400).json({ error: `INVALID MINUTES` });
    }
    if (!aggregation || (aggregation !== 'average')) {
        return res.status(400).json({ error: "INVALID AGGREGATION" });
    }
    const authtoken = await authorization();
    try{
        const response = await axios.get(`http://20.244.56.144/evaluation-service/stocks/${ticker}?minutes=${minutes}`, 
        {headers:
            {'Authorization': `Bearer ${authtoken}`}
        }
        );
        const stock_price_last_m = response.data;
        const averagePrice = calculateAverage(stock_price_last_m);
        res.status(200).json({"averageStockPrice": averagePrice,"priceHistory": stock_price_last_m});
    } catch(err){
        console.log(err);
        res.status(500).json({ error: "Unable to fetch stock prices" });
    }
})





app.listen(PORT, () => {
    console.log("SERVER LISTENING ON PORT: " + PORT);
})