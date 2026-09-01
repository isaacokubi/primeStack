import React from 'react';
import {createRoot} from 'react-dom/client';
import {BrowserRouter} from 'react-router-dom';
import App from './AppNew.jsx';
import './styles.css';
import './homepage.css';
import './portal.css';
import './ui-fixes.css';
import './professional-ui.css';

const FOUNDER_IMAGE_KEY='primeStack.founderImage';
const setFounderImage=()=>{const image=localStorage.getItem(FOUNDER_IMAGE_KEY);if(image)document.documentElement.style.setProperty('--founder-image',`url("${image.replace(/"/g,'\\"')}")`);else document.documentElement.style.removeProperty('--founder-image');};
const styleAdminUploader=()=>{if(!location.pathname.startsWith('/admin')||document.getElementById('primeStackFounderUpload'))return;const box=document.createElement('section');box.id='primeStackFounderUpload';box.innerHTML='<div><strong>Homepage Founder Photo</strong><p>Upload the photo shown on the right side of the homepage.</p><label>Select photo <input id="primeStackFounderInput" type="file" accept="image/jpeg,image/png,image/webp"></label><button id="primeStackFounderRemove" type="button">Remove photo</button></div>';Object.assign(box.style,{position:'fixed',right:'20px',bottom:'20px',zIndex:'99999',maxWidth:'340px',padding:'18px',border:'1px solid rgba(199,243,107,.3)',borderRadius:'16px',background:'#091522',color:'#fff',boxShadow:'0 20px 60px rgba(0,0,0,.4)',fontFamily:'system-ui,sans-serif'});box.querySelector('p').style.cssText='margin:6px 0 12px;color:#9aa9ba;font-size:13px;line-height:1.5';box.querySelector('label').style.cssText='display:block;font-size:13px;font-weight:700;margin-bottom:10px';box.querySelector('input').style.cssText='display:block;margin-top:8px;width:100%';box.querySelector('button').style.cssText='border:1px solid #34495f;background:transparent;color:#c7f36b;border-radius:8px;padding:8px 11px;cursor:pointer';box.querySelector('input').addEventListener('change',e=>{const file=e.target.files?.[0];if(!file)return;if(file.size>5*1024*1024){alert('Please choose an image smaller than 5MB.');e.target.value='';return}const reader=new FileReader();reader.onload=()=>{localStorage.setItem(FOUNDER_IMAGE_KEY,reader.result);setFounderImage();alert('Homepage founder photo updated.');};reader.readAsDataURL(file);});box.querySelector('button').addEventListener('click',()=>{localStorage.removeItem(FOUNDER_IMAGE_KEY);setFounderImage();});document.body.appendChild(box);};
const hideDecorativeSvg=(root=document)=>{root.querySelectorAll('svg').forEach(svg=>{svg.setAttribute('aria-hidden','true');svg.setAttribute('focusable','false');svg.removeAttribute('role');});};
setFounderImage();hideDecorativeSvg();styleAdminUploader();const svgObserver=new MutationObserver(()=>{hideDecorativeSvg();styleAdminUploader();});svgObserver.observe(document.documentElement,{childList:true,subtree:true});
createRoot(document.getElementById('root')).render(<React.StrictMode><BrowserRouter><App/></BrowserRouter></React.StrictMode>);
