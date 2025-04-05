"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { ChevronLeft, Download, File, FileText, Loader2, Plus, Trash2, Upload, X } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface Material {
  id: string;
  title: string;
  description: string | null;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  createdAt: string;
}

interface Course {
  id: string;
  title: string;
}

export default function CourseMaterialsPage({ params }: { params: { courseId: string } }) {
  const courseId = params.courseId;
  const [course, setCourse] = useState<Course | null>(null);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
  });
  
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch course details
        const courseResponse = await fetch(`/api/courses/${courseId}`);
        if (!courseResponse.ok) {
          throw new Error("Failed to fetch course details");
        }
        const courseData = await courseResponse.json();
        setCourse(courseData);
        
        // Fetch materials
        const materialsResponse = await fetch(`/api/materials?courseId=${courseId}`);
        if (materialsResponse.ok) {
          const materialsData = await materialsResponse.json();
          setMaterials(materialsData);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load course materials. Please try again later.",
        });
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [courseId, toast]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Check file size (limit to 20MB)
    if (file.size > 20 * 1024 * 1024) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "File size exceeds 20MB limit.",
      });
      return;
    }
    
    try {
      setIsUploading(true);
      
      const uploadData = new FormData();
      uploadData.append("file", file);
      uploadData.append("type", "material");
      
      const response = await fetch("/api/upload", {
        method: "POST",
        body: uploadData,
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "File upload failed");
      }
      
      const fileData = await response.json();
      setUploadedFile(fileData);
      
      toast({
        title: "Success",
        description: "File uploaded successfully.",
      });
      
      // Auto-fill title with filename if empty
      if (!formData.title) {
        const filename = file.name.replace(/\.[^/.]+$/, ""); // Remove extension
        setFormData(prev => ({
          ...prev,
          title: filename,
        }));
      }
    } catch (error) {
      console.error("Error uploading file:", error);
      toast({
        variant: "destructive",
        title: "Upload Failed",
        description: error instanceof Error ? error.message : "Failed to upload file. Please try again.",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveFile = () => {
    setUploadedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleAddMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !uploadedFile) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Title and file are required.",
      });
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      const materialData = {
        title: formData.title,
        description: formData.description,
        fileUrl: uploadedFile.fileUrl,
        fileType: uploadedFile.fileType,
        fileSize: uploadedFile.fileSize,
        courseId,
      };
      
      const response = await fetch("/api/materials", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(materialData),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to add material");
      }
      
      const newMaterial = await response.json();
      setMaterials(prev => [newMaterial, ...prev]);
      
      toast({
        title: "Success",
        description: "Course material added successfully.",
      });
      
      // Reset form
      setFormData({
        title: "",
        description: "",
      });
      setUploadedFile(null);
      setIsDialogOpen(false);
    } catch (error) {
      console.error("Error adding material:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add material. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteMaterial = async (id: string) => {
    try {
      const response = await fetch(`/api/materials/${id}`, {
        method: "DELETE",
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete material");
      }
      
      // Remove the material from state
      setMaterials(prev => prev.filter(material => material.id !== id));
      
      toast({
        title: "Success",
        description: "Material deleted successfully.",
      });
    } catch (error) {
      console.error("Error deleting material:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete material. Please try again.",
      });
    }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-[60vh]">Loading materials...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <Link 
          href={`/dashboard/teacher/courses/${courseId}`}
          className="text-sm text-blue-600 hover:underline mb-2 inline-flex items-center"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back to course
        </Link>
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Course Materials</h1>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" /> Add Material
              </Button>
            </DialogTrigger>
            <DialogContent>
              <form onSubmit={handleAddMaterial}>
                <DialogHeader>
                  <DialogTitle>Add Course Material</DialogTitle>
                  <DialogDescription>
                    Upload files for your students to access.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    {!uploadedFile ? (
                      <div className="flex justify-center">
                        <div className="w-full max-w-sm">
                          <label 
                            htmlFor="material-upload" 
                            className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-md cursor-pointer hover:bg-gray-50"
                          >
                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                              <Upload className="h-8 w-8 text-gray-400 mb-2" />
                              <p className="mb-2 text-sm text-gray-500">
                                <span className="font-semibold">Click to upload</span> or drag and drop
                              </p>
                              <p className="text-xs text-gray-500">
                                PDF, Word, PowerPoint, ZIP (max 20MB)
                              </p>
                            </div>
                            <input
                              id="material-upload"
                              type="file"
                              className="hidden"
                              onChange={handleFileUpload}
                              disabled={isUploading || isSubmitting}
                              ref={fileInputRef}
                            />
                          </label>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between border rounded-md px-3 py-3">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-md bg-blue-100 flex items-center justify-center text-blue-600">
                            <File className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="font-medium">{uploadedFile.fileName}</p>
                            <p className="text-xs text-gray-500">{formatFileSize(uploadedFile.fileSize)}</p>
                          </div>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                          onClick={handleRemoveFile}
                          disabled={isSubmitting}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    )}

                    {isUploading && (
                      <div className="flex items-center justify-center mt-2">
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        <span className="text-sm">Uploading...</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="title">Title</Label>
                    <Input
                      id="title"
                      name="title"
                      value={formData.title}
                      onChange={handleInputChange}
                      placeholder="e.g., Week 1 Lecture Notes"
                      disabled={isSubmitting}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description (optional)</Label>
                    <Textarea
                      id="description"
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      placeholder="Add a brief description of this material"
                      rows={3}
                      disabled={isSubmitting}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsDialogOpen(false)}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={isSubmitting || !uploadedFile}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Adding...
                      </>
                    ) : (
                      "Add Material"
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
        <p className="text-gray-500">Upload and manage course materials for your students</p>
      </div>

      {materials.length > 0 ? (
        <div className="grid gap-4">
          {materials.map((material) => (
            <Card key={material.id}>
              <CardContent className="p-0">
                <div className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-md bg-blue-100 flex items-center justify-center text-blue-600">
                      <FileIcon fileType={material.fileType} />
                    </div>
                    <div>
                      <h3 className="font-medium">{material.title}</h3>
                      <div className="flex items-center text-xs text-gray-500 mt-0.5">
                        <span>{formatFileSize(material.fileSize)}</span>
                        <span className="mx-1">•</span>
                        <span>{new Date(material.createdAt).toLocaleDateString()}</span>
                      </div>
                      {material.description && (
                        <p className="text-sm text-gray-600 mt-1">{material.description}</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" asChild>
                      <a href={material.fileUrl} target="_blank" download>
                        <Download className="h-4 w-4 mr-1" /> Download
                      </a>
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="sm" className="text-red-500 hover:bg-red-50 hover:text-red-700">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete material?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently delete "{material.title}" and remove it from the course. 
                            This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction 
                            className="bg-red-500 hover:bg-red-600"
                            onClick={() => handleDeleteMaterial(material.id)}
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 border rounded-md bg-gray-50">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-gray-900 mb-1">No materials yet</h3>
          <p className="text-gray-500 mb-4">Upload files for your students to access.</p>
          <Button onClick={() => setIsDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" /> Add Your First Material
          </Button>
        </div>
      )}
    </div>
  );
}

function FileIcon({ fileType }: { fileType: string }) {
  if (fileType.includes('pdf')) return <FileText className="h-5 w-5" />;
  if (fileType.includes('word') || fileType.includes('document')) return <File className="h-5 w-5" />;
  if (fileType.includes('powerpoint') || fileType.includes('presentation')) return <File className="h-5 w-5" />;
  if (fileType.includes('zip') || fileType.includes('archive')) return <File className="h-5 w-5" />;
  if (fileType.includes('image')) return <File className="h-5 w-5" />;
  return <File className="h-5 w-5" />;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + " B";
  else if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  else if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  return (bytes / (1024 * 1024 * 1024)).toFixed(1) + " GB";
}
