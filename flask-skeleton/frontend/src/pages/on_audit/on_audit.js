import { useState, useEffect } from 'react';

import "./on_audit.css";

import Grid from '@mui/material/Grid';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import useMediaQuery from '@mui/material/useMediaQuery';

import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

import text_generator from "../../services/text-generator-service";


function OnAudit(){
    const [url, setUrl] = useState("");
    const [keyword, setKeyword] = useState("");
    const [output, setOutput] = useState([]);
    const [loading, setLoading] = useState(false);
    
    useEffect(() => {
        console.log('output', output);
    }, [output])
    return (    
        <div>
            <Box sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                backgroundColor: '#3f51b5',
                width: 1,
                height: 0.15
            }}>
                <Box sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    width: 'auto',
                    color: 'white'
                }}>
                    <h1>Text Generator</h1>
                    <p>Powered by ChatGPT</p> 
                </Box>
            </Box>
            <Box sx={{
                display: 'flex',
                justifyContent: 'space-around',
                width: 1
            }}>
                
            </Box>
            <Grid container direction={ useMediaQuery('(min-width:600px)')? "row" : "column" } rowSpacing={1} columnSpacing={{ xs: 7, sm: 8, md: 9 }}>
                <Grid item xs={5}>
                    <Box sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        p: 3,
                        m: 2,
                        gap: 1,
                        width: useMediaQuery('(min-width:600px)')? 1 : "auto" 
                    }}>
                            <TextField 
                                id="url" 
                                label="Enter url" 
                                variant="outlined"
                                defaultValue=""
                                onChange={(event) => setUrl(event.target.value)} 
                            />
                            <TextField 
                                id="keyword" 
                                label="Enter keyword" 
                                variant="outlined"
                                defaultValue=""
                                onChange={(event) => setKeyword(event.target.value)} 
                            />
                            <Box sx={{
                                display: 'flex',
                                flexDirection: 'row-reverse'
                            }}>
                                <Button variant="contained" onClick={async()=> {
                                    setLoading(true);
                                    text_generator.onAudit(url, keyword).then(rawResponse => {
                                        setOutput([{
                                            title: "Result",
                                            result: rawResponse
                                        }]);
                                        setLoading(false);
                                    });
                                }}>{
                                    loading && <CircularProgress size={16} style={{'color': "white"}} />
                                }
                                {
                                    !loading && 'Generate'
                                }</Button>
                                <Button variant="contained" style={{'marginRight': '10px'}} onClick={async()=> {
                                    setOutput([]);
                                }}>Clear List</Button>
                            </Box>
                        </Box>
                    </Grid>
                    <Grid item xs={5}>
                        <Box sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            p: 3,
                            m: 2,
                            gap: 1,
                            width: useMediaQuery('(min-width:600px)')? 1 : "auto" 
                        }}>
                            {
                                output.map(x => {
                                    return (
                                        <Accordion>
                                            <AccordionSummary
                                            expandIcon={<ExpandMoreIcon />}
                                            aria-controls="panel1a-content"
                                            id="panel1a-header"
                                            >
                                            <Typography>{x.title}</Typography>
                                            </AccordionSummary>
                                            <AccordionDetails>
                                                <div>
                                                    <strong>Exact Keyword in Meta Title: &nbsp;</strong>
                                                    <span>{x.result.isKeywordInMetaTitle? "PASS" : "FAIL"}</span>
                                                </div>
                                                <div>
                                                    <strong>Meta Length Title: &nbsp;</strong>
                                                    <span>{x.result.metaTitleLength >= 40 && x.result.metaTitleLength <= 60? "PASS" : "FAIL"}</span>
                                                </div>
                                                <div>
                                                    <strong>Exact Keyword in Meta Description: &nbsp;</strong>
                                                    <span>{x.result.isKeywordInMetaDescription? "PASS" : "FAIL"}</span>
                                                </div>
                                                <div>
                                                    <strong>Meta Description Length: &nbsp;</strong>
                                                    <span>{x.result.metaTitleLength < 100 && x.result.metaTitleLength > 150? "FAIL" : "PASS"}</span>
                                                </div>
                                                <div>
                                                    <strong>Exact Keywords in H1:&nbsp;</strong>
                                                    <span>{x.result.isKeywordInArticleTitle? "FAIL" : "PASS"}</span>
                                                </div>
                                                <div>
                                                    <strong>Multiple H1: &nbsp;</strong>
                                                    <span>{x.result.h1Count === 1? "PASS" : "FAIL"}</span>
                                                </div>
                                                <div>
                                                    <strong>H1 Length: &nbsp;</strong>
                                                    <span>{x.result.h1Title.length >= 40 && x.result.h1Title.length <= 60? "PASS" : "FAIL"}</span>
                                                </div>
                                                <div>
                                                    <strong>Is Keyword in Meta URL: &nbsp;</strong>
                                                    <span>{x.result.isKeywordInMetaURL? "PASS" : "FAIL"}</span>
                                                </div>
                                                <div>
                                                    <strong>Exact Keyword in the Article: &nbsp;</strong>
                                                    <span>{x.result.isKeywordInArticleTitle? "PASS" : "FAIL"}</span>
                                                </div>
                                                <div>
                                                    <strong>Exact Keyword in Images: &nbsp;</strong>
                                                    <span>{x.result.keywordInALT? "PASS" : "FAIL"}</span>
                                                </div>
                                                <div>
                                                    <strong>Images have descriptive text:&nbsp;</strong>
                                                    <span>{x.result.allImgHasALT? "PASS" : "FAIL"}</span>
                                                </div>
                                                <div>
                                                    <strong>Has Image larger than 100kb:&nbsp;</strong>
                                                    <span>{x.result.hasImageGreaterThan100? "PASS" : "FAIL"}</span>
                                                </div>
                                            </AccordionDetails>
                                        </Accordion>
                                    );
                                })
                            }
                        </Box>
                    </Grid>
            </Grid>
        </div>
    );
}

export default OnAudit;