"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { type ChangeEvent, type FormEvent, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { FileUp, Send, Settings, FileText, Bot, RefreshCw, Key } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

// Add these styles for the typing animation
const typingAnimationStyles = `
  .typing-animation {
    display: flex;
    align-items: center;
    column-gap: 6px;
    padding: 6px 0;
  }
  
  .typing-animation span {
    height: 8px;
    width: 8px;
    background-color: #8b5cf6;
    border-radius: 50%;
    display: block;
    opacity: 0.4;
  }
  
  .typing-animation span:nth-child(1) {
    animation: pulse 1s infinite ease-in-out;
  }
  
  .typing-animation span:nth-child(2) {
    animation: pulse 1s infinite ease-in-out 0.2s;
  }
  
  .typing-animation span:nth-child(3) {
    animation: pulse 1s infinite ease-in-out 0.4s;
  }
  
  @keyframes pulse {
    0%, 100% {
      transform: scale(1);
      opacity: 0.4;
    }
    50% {
      transform: scale(1.2);
      opacity: 1;
    }
  }

  .chat-container {
    display: flex;
    flex-direction: column;
    height: 70vh;
    max-height: 70vh;
  }

  .chat-header {
    flex-shrink: 0;
  }

  .chat-messages {
    flex-grow: 1;
    overflow-y: auto;
    padding: 1rem;
    display: flex;
    flex-direction: column;
  }

  .chat-messages::-webkit-scrollbar {
    width: 6px;
  }

  .chat-messages::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 10px;
  }

  .chat-messages::-webkit-scrollbar-thumb {
    background: #c5c5c5;
    border-radius: 10px;
  }

  .chat-messages::-webkit-scrollbar-thumb:hover {
    background: #a8a8a8;
  }

  .chat-footer {
    flex-shrink: 0;
  }

  .message-container {
    display: flex;
    margin-bottom: 1rem;
  }

  .message-container.user {
    justify-content: flex-end;
  }

  .message-container.ai {
    justify-content: flex-start;
  }

  .message-content {
    max-width: 80%;
    display: flex;
    gap: 0.75rem;
  }

  .message-bubble {
    padding: 0.75rem;
    border-radius: 0.5rem;
    word-break: break-word;
  }

  .message-bubble.user {
    background: linear-gradient(to right, #7c3aed, #4f46e5);
    color: white;
  }

  .message-bubble.ai {
    background: white;
    border: 1px solid #e5e7eb;
    color: #1f2937;
  }

  .message-time {
    font-size: 0.75rem;
    color: #6b7280;
    margin-top: 0.25rem;
  }

  .message-time.user {
    text-align: right;
  }

  .message-time.ai {
    text-align: left;
  }

  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    text-align: center;
    padding: 2rem;
  }
`;

interface ChatMessage {
   type: "user" | "ai";
   text: string;
   timestamp: Date;
}

export default function Home() {
   const [pdfFile, setPdfFile] = useState<File | null>(null);
   const [pdfName, setPdfName] = useState<string>("");
   const [isPdfUploaded, setIsPdfUploaded] = useState<boolean>(false);
   const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
   const [currentQuestion, setCurrentQuestion] = useState<string>("");
   const [isLoading, setIsLoading] = useState<boolean>(false);
   const [apiKey, setApiKey] = useState<string>("");
   const [showApiDialog, setShowApiDialog] = useState<boolean>(false);
   const [tempKey, setTempKey] = useState<string>("");
   const fileInputRef = useRef<HTMLInputElement>(null);
   const chatEndRef = useRef<HTMLDivElement>(null);
   const messagesContainerRef = useRef<HTMLDivElement>(null);
   const [activeTab, setActiveTab] = useState<string>("chat");

   useEffect(() => {
      // Check for API key on component mount
      const savedApiKey = localStorage.getItem("gemini-api-key");
      if (savedApiKey) {
         setApiKey(savedApiKey);
      } else {
         setShowApiDialog(true);
      }
   }, []);

   useEffect(() => {
      // Scroll to bottom of chat when new messages are added
      if (chatEndRef.current && messagesContainerRef.current) {
         messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
      }
   }, [chatHistory, isLoading]);

   const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file && file.type === "application/pdf") {
         setPdfFile(file);
         setPdfName(file.name);
         toast.success("PDF dosyası seçildi");
      } else {
         setPdfFile(null);
         setPdfName("");
         toast.error("Lütfen bir PDF dosyası seçin.");
      }
   };

   const handleUpload = async () => {
      if (!apiKey) {
         toast.error("API Key gerekli.");
         setShowApiDialog(true);
         return;
      }

      if (!pdfFile) {
         toast.error("Dosya Seçilmedi");
         return;
      }
      setIsLoading(true);
      const formData = new FormData();
      formData.append("file", pdfFile);

      try {
         const response = await fetch("https://pdf-chat-backend-cgc6.onrender.com/upload_pdf/", {
            method: "POST",
            headers: {
               "x-api-key": apiKey,
            },
            body: formData,
         });
         const data = await response.json();

         if (response.ok && data.filename) {
            setPdfName(data.filename);
            setIsPdfUploaded(true);
            setChatHistory([]);
            toast.success("PDF başarıyla yüklendi");
            setActiveTab("chat");
         } else {
            throw new Error(data.error || "Dosya Yüklenemedi.");
         }
      } catch (error: any) {
         console.error("Upload error:", error);
         toast.error(error.message);
         setIsPdfUploaded(false);
      } finally {
         setIsLoading(false);
      }
   };

   const handleAskQuestion = async (e: FormEvent) => {
      e.preventDefault();
      if (!currentQuestion.trim() || !pdfName) return;

      const newQuestion: ChatMessage = {
         type: "user",
         text: currentQuestion,
         timestamp: new Date(),
      };
      setChatHistory((prev) => [...prev, newQuestion]);
      setCurrentQuestion("");
      setIsLoading(true);

      try {
         const response = await fetch("https://pdf-chat-backend-cgc6.onrender.com/chat/", {
            method: "POST",
            headers: {
               "Content-Type": "application/json",
               "x-api-key": apiKey,
            },
            body: JSON.stringify({ pdf_filename: pdfName, query: newQuestion.text }),
         });

         const data = await response.json();

         if (response.ok && data.response) {
            // Add a small delay to make the typing animation visible
            await new Promise((resolve) => setTimeout(resolve, 500));

            const aiResponse: ChatMessage = {
               type: "ai",
               text: data.response,
               timestamp: new Date(),
            };
            setChatHistory((prev) => [...prev, aiResponse]);
         } else {
            throw new Error(data.error || "Soru sorulurken bir hata oluştu.");
         }
      } catch (error: any) {
         console.error("Chat error:", error);
         // Add a small delay to make the typing animation visible
         await new Promise((resolve) => setTimeout(resolve, 500));

         const errorResponse: ChatMessage = {
            type: "ai",
            text: `Hata: ${error.message}`,
            timestamp: new Date(),
         };
         setChatHistory((prev) => [...prev, errorResponse]);
         toast.error("Soru sorulurken bir hata oluştu");
      } finally {
         setIsLoading(false);
      }
   };

   const saveApiKey = (e: FormEvent) => {
      e.preventDefault();
      if (tempKey.trim()) {
         setApiKey(tempKey.trim());
         localStorage.setItem("gemini-api-key", tempKey.trim());
         setShowApiDialog(false);
         toast.success("API Key kaydedildi");
      } else {
         toast.error("Lütfen geçerli bir API Key girin");
      }
   };

   const resetChat = () => {
      setChatHistory([]);
      toast.success("Sohbet geçmişi temizlendi");
   };

   const formatTime = (date: Date) => {
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
   };

   return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 p-4">
         <style jsx global>
            {typingAnimationStyles}
         </style>
         <div className="w-full max-w-4xl">
            <Card className="border-none shadow-lg">
               <CardHeader className="bg-white rounded-t-lg border-b">
                  <div className="flex items-center justify-between">
                     <CardTitle className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 text-transparent bg-clip-text">PDF Chat Assistant</CardTitle>
                     <TooltipProvider>
                        <Tooltip>
                           <TooltipTrigger asChild>
                              <Button variant="ghost" size="icon" onClick={() => setShowApiDialog(true)}>
                                 <Settings className="h-5 w-5 text-slate-600" />
                              </Button>
                           </TooltipTrigger>
                           <TooltipContent>
                              <p>API Ayarları</p>
                           </TooltipContent>
                        </Tooltip>
                     </TooltipProvider>
                  </div>
               </CardHeader>
               <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="grid grid-cols-2 mx-4 mt-2">
                     <TabsTrigger value="upload" className="flex items-center gap-2">
                        <FileUp className="h-4 w-4" />
                        <span>PDF Yükle</span>
                     </TabsTrigger>
                     <TabsTrigger value="chat" className="flex items-center gap-2" disabled={!isPdfUploaded}>
                        <Bot className="h-4 w-4" />
                        <span>Sohbet</span>
                     </TabsTrigger>
                  </TabsList>

                  <TabsContent value="upload" className="m-0">
                     <CardContent className="p-6">
                        <div className="flex flex-col items-center justify-center space-y-6 py-8">
                           <div className="bg-purple-100 rounded-full p-6">
                              <FileText className="h-12 w-12 text-purple-600" />
                           </div>

                           <div className="text-center space-y-2">
                              <h3 className="text-xl font-semibold">PDF Dosyanızı Yükleyin</h3>
                              <p className="text-slate-500 max-w-md">Yüklediğiniz PDF dosyası hakkında sorular sorabilirsiniz.</p>
                           </div>

                           <div className="w-full max-w-md">
                              <Label htmlFor="pdf-upload" className="block mb-2 font-medium">
                                 PDF Dosyası Seçin
                              </Label>
                              <div className="flex items-center gap-2">
                                 <Input id="pdf-upload" type="file" accept=".pdf" onChange={handleFileChange} ref={fileInputRef} className="flex-1" />
                                 <Button onClick={handleUpload} disabled={isLoading || !pdfFile} className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700">
                                    {isLoading ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : <FileUp className="h-4 w-4 mr-2" />}
                                    Yükle
                                 </Button>
                              </div>
                              {pdfName && (
                                 <div className="mt-4 p-3 bg-slate-50 rounded-lg border border-slate-200">
                                    <div className="flex items-center gap-2">
                                       <FileText className="h-5 w-5 text-slate-500" />
                                       <span className="text-sm font-medium text-slate-700 truncate">{pdfName}</span>
                                       <Badge variant="outline" className="ml-auto">
                                          PDF
                                       </Badge>
                                    </div>
                                 </div>
                              )}
                           </div>
                        </div>
                     </CardContent>
                  </TabsContent>

                  <TabsContent value="chat" className="m-0">
                     <div className="chat-container">
                        <div className="chat-header p-3 bg-slate-50 border-b flex items-center justify-between">
                           <div className="flex items-center gap-2">
                              <FileText className="h-4 w-4 text-slate-600" />
                              <span className="text-sm font-medium truncate max-w-[200px] md:max-w-[400px]">{isPdfUploaded ? pdfName : "Henüz PDF Yüklemediniz"}</span>
                           </div>
                           <div className="flex items-center gap-2">
                              <TooltipProvider>
                                 <Tooltip>
                                    <TooltipTrigger asChild>
                                       <Button variant="ghost" size="sm" onClick={resetChat} disabled={!isPdfUploaded}>
                                          <RefreshCw className="h-4 w-4 text-slate-600" />
                                       </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                       <p>Sohbeti Temizle</p>
                                    </TooltipContent>
                                 </Tooltip>
                              </TooltipProvider>

                              <TooltipProvider>
                                 <Tooltip>
                                    <TooltipTrigger asChild>
                                       <Button variant="ghost" size="sm" onClick={() => setActiveTab("upload")}>
                                          <FileUp className="h-4 w-4 text-slate-600" />
                                       </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                       <p>Yeni PDF Yükle</p>
                                    </TooltipContent>
                                 </Tooltip>
                              </TooltipProvider>
                           </div>
                        </div>

                        {isPdfUploaded ? (
                           <>
                              <div className="chat-messages" ref={messagesContainerRef}>
                                 {chatHistory.length === 0 ? (
                                    <div className="empty-state">
                                       <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm max-w-md">
                                          <Bot className="h-12 w-12 text-purple-500 mx-auto mb-4" />
                                          <h3 className="text-lg font-medium text-slate-700">PDF Asistanınıza Hoş Geldiniz</h3>
                                          <p className="text-slate-500 mt-2">Yüklediğiniz PDF dosyası hakkında sorular sorabilirsiniz.</p>
                                       </div>
                                    </div>
                                 ) : (
                                    <>
                                       {chatHistory.map((msg, index) => (
                                          <div key={index} className={`message-container ${msg.type}`}>
                                             <div className="message-content">
                                                {msg.type === "ai" && (
                                                   <Avatar className="h-8 w-8 mt-1 shrink-0">
                                                      <AvatarFallback className="bg-purple-100 text-purple-600">AI</AvatarFallback>
                                                   </Avatar>
                                                )}

                                                <div>
                                                   <div className={`message-bubble ${msg.type}`}>
                                                      <p>{msg.text}</p>
                                                   </div>
                                                   <div className={`message-time ${msg.type}`}>{formatTime(msg.timestamp)}</div>
                                                </div>

                                                {msg.type === "user" && (
                                                   <Avatar className="h-8 w-8 mt-1 shrink-0">
                                                      <AvatarFallback className="bg-indigo-100 text-indigo-600">SN</AvatarFallback>
                                                   </Avatar>
                                                )}
                                             </div>
                                          </div>
                                       ))}
                                       {isLoading && (
                                          <div className="message-container ai">
                                             <div className="message-content">
                                                <Avatar className="h-8 w-8 mt-1 shrink-0">
                                                   <AvatarFallback className="bg-purple-100 text-purple-600">AI</AvatarFallback>
                                                </Avatar>
                                                <div>
                                                   <div className="message-bubble ai">
                                                      <div className="typing-animation">
                                                         <span></span>
                                                         <span></span>
                                                         <span></span>
                                                      </div>
                                                   </div>
                                                </div>
                                             </div>
                                          </div>
                                       )}
                                       <div ref={chatEndRef} />
                                    </>
                                 )}
                              </div>

                              <div className="chat-footer p-3 border-t">
                                 <form onSubmit={handleAskQuestion} className="flex w-full space-x-2">
                                    <Input
                                       type="text"
                                       placeholder="Sorunuzu yazın..."
                                       value={currentQuestion}
                                       onChange={(e) => setCurrentQuestion(e.target.value)}
                                       disabled={isLoading}
                                       className="flex-grow"
                                    />
                                    <Button
                                       type="submit"
                                       disabled={isLoading || !currentQuestion.trim()}
                                       className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
                                    >
                                       {isLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                                    </Button>
                                 </form>
                              </div>
                           </>
                        ) : (
                           <div className="empty-state">
                              <FileUp className="h-12 w-12 text-slate-300 mb-4" />
                              <h3 className="text-lg font-medium text-slate-700">Henüz PDF Yüklemediniz</h3>
                              <p className="text-slate-500 max-w-md mt-2 text-center">Sohbete başlamak için lütfen önce bir PDF dosyası yükleyin.</p>
                              <Button onClick={() => setActiveTab("upload")} className="mt-6 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700">
                                 <FileUp className="h-4 w-4 mr-2" />
                                 PDF Yükle
                              </Button>
                           </div>
                        )}
                     </div>
                  </TabsContent>
               </Tabs>
            </Card>
         </div>

         <Dialog open={showApiDialog} onOpenChange={setShowApiDialog}>
            <DialogContent className="sm:max-w-md">
               <DialogHeader>
                  <DialogTitle>API Key Ayarları</DialogTitle>
                  <DialogDescription>PDF Chat Assistant'ı kullanmak için Gemini API Key'inizi girin.</DialogDescription>
               </DialogHeader>
               <form onSubmit={saveApiKey} className="space-y-4 py-4">
                  <div className="space-y-2">
                     <Label htmlFor="api-key" className="flex items-center gap-2">
                        <Key className="h-4 w-4" />
                        Gemini API Key
                     </Label>
                     <Input id="api-key" type="text" value={tempKey} onChange={(e) => setTempKey(e.target.value)} placeholder="API Key'inizi buraya girin" />
                  </div>
                  <div className="flex justify-end">
                     <Button type="submit" className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700">
                        Kaydet
                     </Button>
                  </div>
               </form>
            </DialogContent>
         </Dialog>
      </div>
   );
}
